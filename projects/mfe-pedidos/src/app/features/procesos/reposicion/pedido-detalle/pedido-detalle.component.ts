import {Component, computed, ElementRef, inject, OnInit, signal, viewChild, WritableSignal, DestroyRef} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CreposicionService} from '../../../../core/services/creposicion.service';
import {DreposicionService} from '../../../../core/services/dreposicion.service';
import {getSessionItem} from '../../../../core/utils/storage.utils';
import {Creposicion, ID} from '../../../../core/models/creposicion';
import {ProductoReposicionDto} from '../../../../core/dto/producto-reposicion.dto';
import {Dreposicion} from '../../../../core/models/dreposicion';
import {cargarImagenDefecto} from '../../../../core/utils/images.utils';
import {ProductoImagenComponent} from '../components/producto-imagen/producto-imagen.component';
import {CantidadEditableComponent} from '../components/cantidad-editable/cantidad-editable.component';
import {EliminarConfirmComponent} from '../components/eliminar-confirm/eliminar-confirm.component';
import {GondolaSelectComponent} from '../components/gondola-select/gondola-select.component';
import {StockOptimoService} from '../../../../core/services/stock-optimo.service';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {ProductoReposicionUpdateDto} from '../../../../core/dto/producto-reposicion-update.dto';
import {finalize, map} from 'rxjs';
import {NotificationService} from 'shared-notifications';
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';
import {environment} from '../../../../../environments/environment';

prepareZXingModule({
  overrides: {
    locateFile: (path: string, prefix: string) =>
      path.endsWith('.wasm') ? `${environment.mfeBaseUrl}/zxing_reader.wasm` : prefix + path,
  },
});

@Component({
  selector: 'app-pedido-detalle',
  standalone: true,
  imports: [
    ProductoImagenComponent,
    CantidadEditableComponent,
    EliminarConfirmComponent,
    GondolaSelectComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './pedido-detalle.component.html',
  styles: `
  `
})
export class PedidoDetalleComponent implements OnInit {

  videoRef = viewChild<ElementRef<HTMLVideoElement>>('video');
  camaraAbierta = signal(false);
  procesandoFoto = signal(false);

  // ---------- refs ----------
  buscadorRef = viewChild<ElementRef<HTMLInputElement>>('buscador');
  cantidadRef = viewChild<ElementRef<HTMLInputElement>>('cantidadInput');
  excelRef = viewChild<ElementRef<HTMLInputElement>>('excelInput');

  // ---------- inyecciones ----------
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly creposicionSvc = inject(CreposicionService);
  private readonly dreposicionSvc = inject(DreposicionService);
  private readonly stockOptimoService = inject(StockOptimoService);
  private readonly notif = inject(NotificationService);
  private readonly fb = inject(NonNullableFormBuilder);

  // ---------- sesión / ruta ----------
  private readonly empresa = +getSessionItem('empresa')!;
  private readonly usuario = getSessionItem('username')!;
  private readonly usuarioCodigo = getSessionItem('usrId')!;   // AJUSTAR si StockOptimo.usuario es otro valor
  readonly codigo = +this.route.snapshot.paramMap.get('id')!;

  private resaltadoTimer: ReturnType<typeof setTimeout> | null = null;

  //scanner
  private stream?: MediaStream;
  private escaneoTimer: ReturnType<typeof setTimeout> | null = null;
  private escaneoActivo = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.detenerEscaner());
  }

  // ---------- datos ----------
  pedido = signal<Creposicion | null>(null);
  items = signal<ProductoReposicionDto[]>([]);

  // ---------- búsqueda ----------
  barraItem = signal('');
  buscando = signal(false);
  encontrados = signal<ProductoReposicionDto[]>([]);
  producto = signal<ProductoReposicionDto | null>(null);

  // ---------- captura del producto ----------
  cantidad = signal(1);
  observacion = signal('');
  gondolaId = signal<number | null>(null);   // solo se usa en pedidos urgentes
  agregando = signal(false);

  // ---------- acciones sobre items ----------
  eliminandoId = signal<number | null>(null);
  resaltadoId = signal<number | null>(null);

  // ---------- visor de imagen ----------
  imagenAmpliada = signal<string | null>(null);

  // ---------- min / max ----------
  minMaxAbierto = signal(false);
  minMaxForm = this.fb.group({
    min: [0, [Validators.required, Validators.min(0)]],
    max: [0, [Validators.required, Validators.min(0)]],
  });

  //upload
  subiendo = signal(false);
  cargandoItems = signal(true);

  puedeSubir = computed(() =>
    !!this.pedido() && !this.subiendo() && !this.enviando()
  );

  /** true mientras hay una operación que debe bloquear la captura */
  ocupado = computed(() =>
    this.enviando() || this.subiendo() || this.cargandoItems() || this.buscando() || this.agregando()
  );

  // ---------- derivados ----------
  esUrgente = computed(() => this.pedido()?.urgente === 1);

  /** Nombre de la góndola del pedido (para pedidos no urgentes) */
  gondolaPedidoNombre = computed<string | null>(() => this.pedido()?.gondola?.nombre ?? null);   // AJUSTAR campo

  /** Góndola con la que se guardará el producto actual */
  gondolaDestino = computed<number | null>(() => {
    const p = this.producto();
    const ped = this.pedido();
    const porDefecto = p?.gonCod ?? null;
    if (!ped) return porDefecto;

    return this.esUrgente()
      ? (this.gondolaId() ?? porDefecto)
      : ((ped.gondolaId as number | null) ?? porDefecto);
  });

  yaEnPedido = computed(() => {
    const p = this.producto();
    return !!p && this.items().some(i => i.codigoProducto === p.codigoProducto);
  });

  sinStockZh = computed(() => {
    const p = this.producto();
    return !!p && (p.stockZh ?? 0) <= 0;
  });

  excedeStock = computed(() => {
    const p = this.producto();
    return !!p && this.cantidad() > (p.stockZh ?? 0);
  });

  puedeAgregar = computed(() =>
    !!this.pedido() &&
    !!this.producto() &&
    !this.yaEnPedido() &&
    !this.sinStockZh() &&
    !this.excedeStock() &&
    this.cantidad() > 0 &&
    !this.ocupado()
  );

  enviando = signal(false);
  confirmandoEnvio = signal(false);

  puedeEnviar = computed(() =>
    !!this.pedido() && this.items().length > 0 && !this.enviando() && !this.subiendo()
  );

  // ---------- ciclo de vida ----------
  ngOnInit() {
    this.creposicionSvc.getPedido(this.codigo, this.empresa).subscribe({
      next: p => this.pedido.set(p),
      error: e => console.error(e),
    });
    this.cargarItems();
  }

  private cargarItems() {
    this.cargandoItems.set(true);
    this.dreposicionSvc.getProductsByCreposicion(this.codigo)
      .pipe(finalize(() => this.cargandoItems.set(false)))
      .subscribe({
        next: l => this.items.set([...l].sort((a, b) => b.id - a.id)),   // los más nuevos primero
        error: e => console.error(e),
      });
  }

  // ---------- búsqueda ----------
  mostrarProducto() {
    const bodega = this.pedido()?.bodegaId;
    const dato = this.barraItem().trim().toUpperCase();
    if (!bodega || !dato || this.ocupado()) return;

    // limpiar el input apenas se busca
    this.barraItem.set('');
    const el = this.buscadorRef()?.nativeElement;
    if (el) {
      el.value = '';
      el.focus();
    }

    // 1) ¿ya está en el pedido? (coincidencia exacta por barra o item)
    const existente = this.buscarEnItems(dato);
    if (existente) {
      this.producto.set(null);
      this.encontrados.set([]);
      this.avisarDuplicado(existente);
      return;
    }

    // 2) búsqueda normal
    this.buscando.set(true);
    this.producto.set(null);
    this.encontrados.set([]);

    this.dreposicionSvc.getProduct(bodega, dato).subscribe({
      next: lista => {
        this.buscando.set(false);

        if (lista.length === 0) {
          this.notif.showToast({
            type: 'warning',
            summary: 'Sin resultados',
            detail: 'No se encontró el producto',
            autoCloseMs: 2500,
          });
          return;
        }

        if (lista.length === 1) {
          // 3) el back devolvió uno que ya está en el pedido (por otra barra o código)
          const dup = this.items().find(i => i.codigoProducto === lista[0].codigoProducto);
          if (dup) {
            this.avisarDuplicado(dup);
            return;
          }
          this.seleccionarProducto(lista[0]);
        } else {
          this.encontrados.set(lista);
        }
      },
      error: e => {
        console.error(e);
        this.buscando.set(false);
      },
    });
  }

  seleccionarProducto(p: ProductoReposicionDto) {
    this.producto.set(p);
    this.encontrados.set([]);
    this.cantidad.set(1);
    this.observacion.set('');
    this.gondolaId.set(null);
    setTimeout(() => this.cantidadRef()?.nativeElement.select());
  }

  cancelarProducto() {
    this.producto.set(null);
    this.encontrados.set([]);
    this.enfocarBuscador()
  }

  // ---------- agregar ----------
  agregar() {
    if (!this.puedeAgregar()) return;
    const p = this.producto()!;
    const cant = this.cantidad();

    this.agregando.set(true);

    const d: Dreposicion = {
      id: {empresa: this.empresa},
      creposicionId: this.codigo,
      productoId: p.id,
      cantSol: cant,
      cantApr: cant,
      observacion: this.observacion().trim(),
      gondolaId: this.gondolaDestino(),
      precio: p.precio,
      usuario: this.usuario,
    };

    this.dreposicionSvc.addedProduct(d).subscribe({
      next: () => {
        this.agregando.set(false);
        this.producto.set(null);
        this.barraItem.set('');
        this.cargarItems();
        this.buscadorRef()?.nativeElement.focus();
      },
      error: e => {
        console.error(e);
        this.agregando.set(false);
      },
    });
  }

  // ---------- items ----------
  actualizarCanApr(p: ProductoReposicionDto, canApr: number) {
    const request: ProductoReposicionUpdateDto = {
      codigo: p.id,
      productoId: p.codigoProducto,
      cantidad: canApr,
      gondola: null,
    };

    this.dreposicionSvc.updateProdcut(request).subscribe({
      next: () => this.items.update(l => l.map(i => i.id === p.id ? {...i, canApr} : i)),
      error: err => console.error('Error actualizando cantidad aprobada', err),
    });
  }

  eliminar(id: number) {
    if (this.eliminandoId() !== null) return;
    this.eliminandoId.set(id);

    this.dreposicionSvc.deleteProductoReposicion(id, this.empresa).subscribe({
      next: () => {
        this.items.update(l => l.filter(i => i.id !== id));
        this.eliminandoId.set(null);
        this.notif.showToast({
          type: 'warning',
          summary: 'Item eliminado',
          detail: 'Producto eliminado de la lista',
          autoCloseMs: 3000,
        });
      },
      error: () => this.eliminandoId.set(null),
    });
  }

  // ---------- min / max ----------
  abrirMinMax() {
    const p = this.producto();
    if (!p) return;
    this.minMaxForm.setValue({min: p.min ?? 0, max: p.max ?? 0});
    this.minMaxAbierto.set(true);
  }

  cerrarMinMax() {
    this.minMaxAbierto.set(false);
  }

  guardarMinMax() {
    const p = this.producto();
    const bodega = this.pedido()?.bodegaId;
    if (!p || !bodega || this.minMaxForm.invalid) return;

    const {min, max} = this.minMaxForm.getRawValue();
    const esNuevo = !p.codigoStock;

    const request$ = esNuevo
      ? this.stockOptimoService.crearMinMax({
        id: {empresa: this.empresa},
        maximo: max,
        minimo: min,
        bodega,
        gondola: this.gondolaDestino(),
        producto: p.id,
        usuario: this.usuarioCodigo,
        creaUsr: this.usuario,
      }).pipe(map(r => (r as any).id?.codigo as number | undefined))   // AJUSTAR: dónde viene el código
      : this.stockOptimoService.updateMinMax({
        codigo: p.codigoStock,
        empresa: this.empresa,
        maximo: max,
        minimo: min,
        usr: this.usuario
      }).pipe(map(() => p.codigoStock));

    request$.subscribe({
      next: codigoStock => {
        this.producto.set({...p, min, max, codigoStock: codigoStock ?? p.codigoStock});
        this.notif.showToast({
          type: 'success',
          summary: 'Guardado',
          detail: 'Mínimo-Máximo guardado correctamente',
          autoCloseMs: 2000,
        });
        this.cerrarMinMax();
      },
      error: err => console.error('Error al guardar min/max', err),
    });
  }

  // ---------- enviar pedido ----------
  pedirConfirmacionEnvio() {
    if (!this.puedeEnviar()) return;
    this.confirmandoEnvio.set(true);
  }

  cancelarEnvio() {
    this.confirmandoEnvio.set(false);
  }

  enviarPedido() {
    if (!this.puedeEnviar()) return;
    this.enviando.set(true);
    this.confirmandoEnvio.set(false);

    const id: ID = {codigo: this.codigo, empresa: this.empresa};

    this.creposicionSvc.generarSolicitud(id).subscribe({
      next: (resp) => {
        this.enviando.set(false);

        if (!resp.success) {
          this.notif.showToast({
            type: 'error',
            summary: 'No se pudo enviar',
            detail: resp.message || 'Intenta de nuevo',
            autoCloseMs: 4000,
          });
          return;
        }

        this.notif.showToast({
          type: 'success',
          summary: 'Pedido enviado',
          detail: resp.message || `El pedido #${this.codigo} fue enviado para aprobación`,
          autoCloseMs: 3000,
        });
        this.regresar();
      },
      error: e => {
        console.error(e);
        this.enviando.set(false);
        this.notif.showToast({
          type: 'error',
          summary: 'Error',
          detail: 'No se pudo enviar el pedido',
          autoCloseMs: 4000,
        });
      },
    });
  }

  // ---------- navegación ----------
  regresar() {
    this.router.navigate(['/erp/pedidos/procesos/reposicion/nuevo-pedido']).then(() => {});
  }

  // ---------- helpers ----------
  onInput(sig: WritableSignal<string>, e: Event) {
    sig.set((e.target as HTMLInputElement).value);
  }

  onNumber(sig: WritableSignal<number>, e: Event) {
    sig.set(Number((e.target as HTMLInputElement).value));
  }

  onImgError(e: Event) {
    cargarImagenDefecto(e);
  }

  private buscarEnItems(dato: string): ProductoReposicionDto | undefined {
    const d = dato.toUpperCase();
    return this.items().find(i =>
      i.barra?.toUpperCase() === d || i.item?.toUpperCase() === d
    );
  }

  private avisarDuplicado(item: ProductoReposicionDto) {
    this.subirAlInicio(item.id);
    this.notif.showToast({
      type: 'warning',
      summary: 'Item ya agregado',
      detail: `${item.item} ya está en el pedido`,
      autoCloseMs: 2500,
    });
  }

  private subirAlInicio(id: number) {
    this.items.update(l => {
      const idx = l.findIndex(i => i.id === id);
      if (idx <= 0) return l;
      const copia = [...l];
      const [mov] = copia.splice(idx, 1);
      return [mov, ...copia];
    });

    if (this.resaltadoTimer) clearTimeout(this.resaltadoTimer);
    this.resaltadoId.set(id);
    this.resaltadoTimer = setTimeout(() => this.resaltadoId.set(null), 3500);
  }

  // ---------- carga de Excel ----------
  onExcelSeleccionado(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';   // permite volver a elegir el mismo archivo
    if (!file || !this.puedeSubir()) return;

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      this.notif.showToast({
        type: 'warning',
        summary: 'Archivo no válido',
        detail: 'Solo se permiten archivos Excel (.xlsx o .xls)',
        autoCloseMs: 3000,
      });
      return;
    }

    this.subiendo.set(true);

    this.dreposicionSvc.uploadFile(file, this.codigo).subscribe({
      next: resp => {
        this.subiendo.set(false);
        this.notif.showToast({
          type: resp.success ? 'success' : 'error',
          summary: resp.success ? 'Excel cargado' : 'No se pudo cargar',
          detail: resp.message,
          autoCloseMs: 6000,   // el mensaje puede traer observaciones largas
        });
        if (resp.success) this.cargarItems();
      },
      error: err => {
        console.error(err);
        this.subiendo.set(false);
        this.notif.showToast({
          type: 'error',
          summary: 'Error',
          detail: 'No se pudo procesar el archivo',
          autoCloseMs: 4000,
        });
      },
    });
  }

  abrirSelectorExcel() {
    this.excelRef()?.nativeElement.click();
  }

  private enfocarBuscador() {
    setTimeout(() => this.buscadorRef()?.nativeElement.focus());
  }

  // ---------- scanner ----------
  private readonly canvas = document.createElement('canvas');
  private readonly ctx = this.canvas.getContext('2d', {willReadFrequently: true})!;
  private ultimoCodigo = '';
  private repeticiones = 0;
  private erroresSeguidos = 0;
  private detectorNativo?: { detect(src: ImageBitmapSource): Promise<{ rawValue: string }[]> };

  abrirCamara() {
    if (this.ocupado()) return;
    this.ultimoCodigo = '';
    this.repeticiones = 0;
    this.erroresSeguidos = 0;
    this.camaraAbierta.set(true);
    setTimeout(() => this.iniciarEscaner());   // espera a que exista el <video>
  }

  cerrarCamara() {
    this.detenerEscaner();
    this.camaraAbierta.set(false);
  }

  // ----- detector -----
  /** Detector nativo (Google, Chrome Android) si soporta EAN-13. Si no, queda zxing. */
  private async prepararDetector() {
    if (this.detectorNativo) return;

    const BD = (window as any).BarcodeDetector;
    console.log('Contexto seguro:', window.isSecureContext, '| BarcodeDetector existe:', !!BD);   // quítalo después
    if (!BD) return;

    try {
      const formatos: string[] = await BD.getSupportedFormats();
      if (formatos.includes('ean_13')) {
        this.detectorNativo = new BD({formats: ['ean_13']});
      }
    } catch (e) {
      console.warn('No se pudo iniciar el detector nativo', e);
    }
  }

  private ean13Valido(c: string): boolean {
    if (!/^\d{13}$/.test(c)) return false;
    let s = 0;
    for (let i = 0; i < 12; i++) s += Number(c[i]) * (i % 2 === 0 ? 1 : 3);
    return (10 - (s % 10)) % 10 === Number(c[12]);
  }

  /** Devuelve el texto leído o null. Nativo primero, zxing como respaldo. */
  private async detectar(video: HTMLVideoElement): Promise<string | null> {
    if (this.detectorNativo) {
      try {
        const r = await this.detectorNativo.detect(video);
        return r[0]?.rawValue ?? null;
      } catch (e) {
        console.warn('Detector nativo falló, paso a zxing', e);
        this.detectorNativo = undefined;
      }
    }

    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;
    this.ctx.drawImage(video, 0, 0);
    const img = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    const r = await readBarcodes(img, {
      formats: ['EAN-13'],
      tryHarder: true,
      tryRotate: true,
      tryInvert: true,
      tryDownscale: true,
      maxNumberOfSymbols: 1,
    });
    return r[0]?.isValid ? r[0].text : null;
  }

  // ----- cámara y bucle -----
  private async iniciarEscaner() {
    const video = this.videoRef()?.nativeElement;
    if (!video) return;

    this.escaneoActivo = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {ideal: 'environment'},
          width: {ideal: 1920},
          height: {ideal: 1080},
        },
        audio: false,
      });

      // el usuario pudo cerrar el modal mientras aceptaba el permiso
      if (!this.escaneoActivo) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      this.stream = stream;
      video.muted = true;               // iOS lo exige
      video.srcObject = stream;
      await video.play();

      // enfoque continuo si el equipo lo permite (en muchos Android solo hay "manual")
      const track = stream.getVideoTracks()[0];
      const caps: any = track.getCapabilities?.() ?? {};
      if (caps.focusMode?.includes('continuous')) {
        await track.applyConstraints({advanced: [{focusMode: 'continuous'} as any]}).catch(() => {});
      }

      await this.prepararDetector();
      console.log('Motor:', this.detectorNativo ? 'nativo (Google)' : 'zxing-wasm');   // quítalo después
      if (!this.escaneoActivo) return;

      await this.leerFrame(video);
    } catch (e) {
      console.error(e);
      this.cerrarCamara();
      this.notif.showToast({
        type: 'warning',
        summary: 'Cámara',
        detail: 'No se pudo abrir la cámara. Revisa los permisos.',
        autoCloseMs: 3000,
      });
    }
  }

  private async leerFrame(video: HTMLVideoElement) {
    if (!this.escaneoActivo) return;

    try {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const texto = await this.detectar(video);
        if (texto && this.ean13Valido(texto) && this.escaneoActivo && this.confirmar(texto)) {
          this.codigoEscaneado(texto);
          return;
        }
      }
    } catch (e) {
      console.warn('Lectura fallida, sigo intentando', e);
      if (++this.erroresSeguidos >= 5) {
        this.cerrarCamara();
        this.notif.showToast({
          type: 'error', summary: 'Escáner',
          detail: 'No se pudo iniciar el lector de códigos', autoCloseMs: 3000,
        });
        return;
      }
    }

    this.escaneoTimer = setTimeout(() => this.leerFrame(video), 150);
  }

  /** Exige la misma lectura en 2 frames seguidos (el checksum no basta contra falsos positivos). */
  private confirmar(texto: string): boolean {
    if (texto === this.ultimoCodigo) {
      this.repeticiones++;
    } else {
      this.ultimoCodigo = texto;
      this.repeticiones = 1;
    }
    return this.repeticiones >= 2;
  }

  private detenerEscaner() {
    this.escaneoActivo = false;
    if (this.escaneoTimer) {
      clearTimeout(this.escaneoTimer);
      this.escaneoTimer = null;
    }
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = undefined;
  }

  codigoEscaneado(codigo: string) {
    this.cerrarCamara();
    this.barraItem.set(codigo);
    this.mostrarProducto();
  }

  abrirSelectorFoto() {
    this.cerrarCamara();   // suelta la cámara en vivo

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');   // en PC se ignora

    input.onchange = () => {
      const file = input.files?.[0];
      console.log('foto recibida', file?.name, file?.size);   // quítalo después
      if (file) void this.procesarFoto(file);
    };

    input.click();   // debe ejecutarse dentro del clic del usuario, sin await antes
  }

  private async procesarFoto(file: File) {
    this.procesandoFoto.set(true);
    try {
      const texto = await this.leerArchivo(file);
      console.log('texto leído:', texto);   // quítalo después
      if (texto && this.ean13Valido(texto)) {
        this.codigoEscaneado(texto);
        return;
      }
      this.notif.showToast({
        type: 'warning',
        summary: 'Sin lectura',
        detail: 'No se detectó un código. Intenta otra foto, más cerca y enfocada.',
        autoCloseMs: 3500,
      });
    } catch (err) {
      console.error('Error leyendo foto', err);
      this.notif.showToast({
        type: 'error',
        summary: 'Error',
        detail: 'No se pudo procesar la foto',
        autoCloseMs: 3500,
      });
    } finally {
      this.procesandoFoto.set(false);
    }
  }

  private async leerArchivo(file: File): Promise<string | null> {
    await this.prepararDetector();

    // reduce la foto (12 MP+ es lento y no aporta); respeta la orientación EXIF
    const bmp = await createImageBitmap(file, {resizeWidth: 1920, resizeQuality: 'high'});
    try {
      if (this.detectorNativo) {
        try {
          const r = await this.detectorNativo.detect(bmp);
          if (r[0]?.rawValue) return r[0].rawValue;
        } catch { /* paso a zxing */ }
      }

      this.canvas.width = bmp.width;
      this.canvas.height = bmp.height;
      this.ctx.drawImage(bmp, 0, 0);
      const img = this.ctx.getImageData(0, 0, bmp.width, bmp.height);

      const r = await readBarcodes(img, {
        formats: ['EAN-13'],
        tryHarder: true,
        tryRotate: true,
        tryInvert: true,
        tryDownscale: true,
        maxNumberOfSymbols: 1,
      });
      return r[0]?.isValid ? r[0].text : null;
    } finally {
      bmp.close();
    }
  }

}
