import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
  WritableSignal
} from '@angular/core';
import {CantidadEditableComponent} from '../components/cantidad-editable/cantidad-editable.component';
import {EliminarConfirmComponent} from '../components/eliminar-confirm/eliminar-confirm.component';
import {PaginatorModule} from 'primeng/paginator';
import {ProductoImagenComponent} from '../components/producto-imagen/producto-imagen.component';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {CreposicionService} from '../../../../core/services/creposicion.service';
import {DreposicionService} from '../../../../core/services/dreposicion.service';
import {NotificationService} from 'shared-notifications';
import {getSessionItem} from '../../../../core/utils/storage.utils';
import {finalize} from 'rxjs';
import {Dreposicion} from '../../../../core/models/dreposicion';
import {ProductoReposicionDto} from '../../../../core/dto/producto-reposicion.dto';
import {Creposicion} from '../../../../core/models/creposicion';
import {ProductoReposicionUpdateDto} from '../../../../core/dto/producto-reposicion-update.dto';
import {cargarImagenDefecto} from '../../../../core/utils/images.utils';
import {ID} from '../../../../core/models/gondola';
import {BodegaStoreService} from '../../../../core/services/bodega-store.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {readBarcodes} from 'zxing-wasm/reader';
import {DatePipe} from '@angular/common';

// TODO: pon aquí la ruta real del listado de solicitudes de transferencia
const RUTA_LISTADO = '/erp/pedidos/procesos/transferencia/nueva-solicitud';

const OPCIONES_ZXING = {
  formats: ['EAN-13'] as ['EAN-13'],
  tryHarder: true,
  tryRotate: true,
  tryInvert: true,
  tryDownscale: true,
  maxNumberOfSymbols: 1,
};

@Component({
  selector: 'app-solicitud-detalle',
  standalone: true,
  imports: [
    CantidadEditableComponent,
    EliminarConfirmComponent,
    PaginatorModule,
    ProductoImagenComponent,
    ReactiveFormsModule,
    DatePipe
  ],
  templateUrl: './solicitud-detalle.component.html',
  styles: ``
})
export class SolicitudDetalleComponent implements OnInit {

  // ---------- dependencias ----------
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly creposicionSvc = inject(CreposicionService);
  private readonly dreposicionSvc = inject(DreposicionService);
  private readonly bodegaStore = inject(BodegaStoreService);
  private readonly notif = inject(NotificationService);

  private readonly empresa = Number(getSessionItem('empresa'));
  private readonly usuario = getSessionItem('username')!;
  readonly codigo = Number(this.route.snapshot.paramMap.get('id'));

  // ---------- refs ----------
  readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('video');
  readonly buscadorRef = viewChild<ElementRef<HTMLInputElement>>('buscador');
  readonly cantidadRef = viewChild<ElementRef<HTMLInputElement>>('cantidadInput');
  readonly excelRef = viewChild<ElementRef<HTMLInputElement>>('excelInput');

  // ---------- datos ----------
  readonly solicitud = signal<Creposicion | null>(null);
  readonly items = signal<ProductoReposicionDto[]>([]);
  readonly cargandoItems = signal(true);

  // ---------- búsqueda ----------
  readonly barraItem = signal('');
  readonly buscando = signal(false);
  readonly encontrados = signal<ProductoReposicionDto[]>([]);
  readonly producto = signal<ProductoReposicionDto | null>(null);

  // ---------- captura del producto ----------
  readonly cantidad = signal(1);
  readonly observacion = signal('');
  readonly agregando = signal(false);

  // ---------- acciones sobre items ----------
  readonly eliminandoId = signal<number | null>(null);
  readonly resaltadoId = signal<number | null>(null);
  private resaltadoTimer: ReturnType<typeof setTimeout> | null = null;

  // ---------- visor / cámara ----------
  readonly imagenAmpliada = signal<string | null>(null);
  readonly camaraAbierta = signal(false);
  readonly procesandoFoto = signal(false);

  // ---------- estado de operaciones ----------
  readonly subiendo = signal(false);
  readonly enviando = signal(false);
  readonly confirmandoEnvio = signal(false);

  // ---------- nombres de bodega ----------
  readonly bodegaRequiere = computed(() => this.nombreBodega(this.solicitud()?.bodegaId));
  readonly bodegaSolicita = computed(() => this.nombreBodega(this.solicitud()?.bodegaFinId));

  // ---------- derivados ----------
  readonly puedeSubir = computed(() =>
    !!this.solicitud() && !this.subiendo() && !this.enviando()
  );

  /** true mientras hay una operación que debe bloquear la captura */
  readonly ocupado = computed(() =>
    this.enviando() || this.subiendo() || this.cargandoItems() || this.buscando() || this.agregando()
  );

  readonly yaEnPedido = computed(() => {
    const p = this.producto();
    return !!p && this.items().some(i => i.codigoProducto === p.codigoProducto);
  });

  readonly sinStockZh = computed(() => {
    const p = this.producto();
    return !!p && (p.stockZh ?? 0) <= 0;
  });

  readonly excedeStock = computed(() => {
    const p = this.producto();
    return !!p && this.cantidad() > (p.stockZh ?? 0);
  });

  readonly puedeAgregar = computed(() =>
    !!this.solicitud() &&
    !!this.producto() &&
    !this.yaEnPedido() &&
    !this.sinStockZh() &&
    !this.excedeStock() &&
    this.cantidad() > 0 &&
    !this.ocupado()
  );

  readonly puedeEnviar = computed(() =>
    !!this.solicitud() && this.items().length > 0 && !this.enviando() && !this.subiendo()
  );

  // ---------- scanner ----------
  private stream?: MediaStream;
  private escaneoTimer: ReturnType<typeof setTimeout> | null = null;
  private escaneoActivo = false;
  private ultimoCodigo = '';
  private repeticiones = 0;
  private erroresSeguidos = 0;
  private readonly canvas = document.createElement('canvas');
  private readonly ctx = this.canvas.getContext('2d', {willReadFrequently: true})!;
  private detectorNativo?: { detect(src: ImageBitmapSource): Promise<{ rawValue: string }[]> };

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.detenerEscaner();
      if (this.resaltadoTimer) clearTimeout(this.resaltadoTimer);
    });
  }

  ngOnInit() {
    this.bodegaStore.cargar();

    this.creposicionSvc.getPedido(this.codigo, this.empresa)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: p => this.solicitud.set(p),
        error: e => {
          console.error(e);
          this.toastError('No se pudo cargar la solicitud');
        },
      });

    this.cargarItems();
  }

  // ---------- helpers ----------
  private nombreBodega(id?: number | null): string {
    if (!id) return '—';
    const bodegas = this.bodegaStore.bodegas();
    return bodegas.find(b => b.codigo === id)?.nombre ?? (bodegas.length ? 'Sin bodega' : '—');
  }

  private toastError(detail: string, summary = 'Error') {
    this.notif.showToast({type: 'error', summary, detail, autoCloseMs: 4000});
  }

  onInput(sig: WritableSignal<string>, e: Event) {
    sig.set((e.target as HTMLInputElement).value);
  }

  onNumber(sig: WritableSignal<number>, e: Event) {
    sig.set(Number((e.target as HTMLInputElement).value));
  }

  onImgError(e: Event) {
    cargarImagenDefecto(e);
  }

  private enfocarBuscador() {
    setTimeout(() => this.buscadorRef()?.nativeElement.focus());
  }

  // ---------- carga de items ----------
  private cargarItems() {
    this.cargandoItems.set(true);
    this.dreposicionSvc.getProductsByCreposicion(this.codigo)
      .pipe(
        finalize(() => this.cargandoItems.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: l => this.items.set([...l].sort((a, b) => b.id - a.id)),   // los más nuevos primero
        error: e => {
          console.error(e);
          this.toastError('No se pudieron cargar los productos');
        },
      });
  }

  // ---------- búsqueda ----------
  mostrarProducto() {
    const bodega = this.solicitud()?.bodegaId;
    const bodFin = this.solicitud()?.bodegaFinId;
    const dato = this.barraItem().trim().toUpperCase();
    if (!bodega || !bodFin || !dato || this.ocupado()) return;

    // limpiar el input apenas se busca
    this.barraItem.set('');
    const el = this.buscadorRef()?.nativeElement;
    if (el) {
      el.value = '';
      el.focus();
    }

    // 1) ¿ya está en la solicitud? (coincidencia exacta por barra o item)
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

    this.dreposicionSvc.getProductsByBodegas(bodega, bodFin, dato)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
            // 3) el back devolvió uno que ya está en la solicitud (por otra barra o código)
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
          this.toastError('No se pudo buscar el producto');
        },
      });
  }

  seleccionarProducto(p: ProductoReposicionDto) {
    this.producto.set(p);
    this.encontrados.set([]);
    this.cantidad.set(1);
    this.observacion.set('');
    setTimeout(() => this.cantidadRef()?.nativeElement.select());
  }

  cancelarProducto() {
    this.producto.set(null);
    this.encontrados.set([]);
    this.enfocarBuscador();
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
      detail: `${item.item} ya está en la solicitud`,
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
      gondolaId: null,
      precio: p.precio,
      usuario: this.usuario,
    };

    this.dreposicionSvc.addedProduct(d)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.agregando.set(false);
          this.producto.set(null);
          this.barraItem.set('');
          this.cargarItems();
          this.enfocarBuscador();
        },
        error: e => {
          console.error(e);
          this.agregando.set(false);
          this.toastError('No se pudo agregar el producto');
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

    this.dreposicionSvc.updateProdcut(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.items.update(l => l.map(i => i.id === p.id ? {...i, canApr} : i)),
        error: err => {
          console.error('Error actualizando cantidad aprobada', err);
          this.toastError('No se pudo actualizar la cantidad');
          this.cargarItems();   // vuelve al valor real del servidor
        },
      });
  }

  eliminar(id: number) {
    if (this.eliminandoId() !== null) return;
    this.eliminandoId.set(id);

    this.dreposicionSvc.deleteProductoReposicion(id, this.empresa)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
        error: () => {
          this.eliminandoId.set(null);
          this.toastError('No se pudo eliminar el item');
        },
      });
  }

  // ---------- enviar solicitud ----------
  pedirConfirmacionEnvio() {
    if (!this.puedeEnviar()) return;
    this.confirmandoEnvio.set(true);
  }

  cancelarEnvio() {
    this.confirmandoEnvio.set(false);
  }

  enviarSolicitud() {
    if (!this.puedeEnviar()) return;
    this.enviando.set(true);
    this.confirmandoEnvio.set(false);

    const id: ID = {codigo: this.codigo, empresa: this.empresa};

    this.creposicionSvc.generarSolicitud(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: resp => {
          this.enviando.set(false);

          if (!resp.success) {
            this.toastError(resp.message || 'Intenta de nuevo', 'No se pudo enviar');
            return;
          }

          this.notif.showToast({
            type: 'success',
            summary: 'Solicitud enviada',
            detail: resp.message || `La solicitud #${this.codigo} fue enviada para aprobación`,
            autoCloseMs: 3000,
          });
          this.regresar();
        },
        error: e => {
          console.error(e);
          this.enviando.set(false);
          this.toastError('No se pudo enviar la solicitud');
        },
      });
  }

  // ---------- navegación ----------
  regresar() {
    void this.router.navigate([RUTA_LISTADO]);
  }

  // ---------- carga de Excel ----------
  abrirSelectorExcel() {
    this.excelRef()?.nativeElement.click();
  }

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

    this.dreposicionSvc.uploadFile(file, this.codigo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
          this.toastError('No se pudo procesar el archivo');
        },
      });
  }

  // ======================================================================
  // SCANNER
  // ======================================================================

  abrirCamara() {
    if (this.ocupado()) return;
    this.ultimoCodigo = '';
    this.repeticiones = 0;
    this.erroresSeguidos = 0;
    this.camaraAbierta.set(true);
    setTimeout(() => void this.iniciarEscaner());   // espera a que exista el <video>
  }

  cerrarCamara() {
    this.detenerEscaner();
    this.camaraAbierta.set(false);
  }

  /** Detector nativo (Google, Chrome Android) si soporta EAN-13. Si no, queda zxing. */
  private async prepararDetector() {
    if (this.detectorNativo) return;

    const BD = (window as any).BarcodeDetector;
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

  private async leerConZxing(img: ImageData): Promise<string | null> {
    const r = await readBarcodes(img, OPCIONES_ZXING);
    return r[0]?.isValid ? r[0].text : null;
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
    return this.leerConZxing(this.ctx.getImageData(0, 0, video.videoWidth, video.videoHeight));
  }

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

      // enfoque continuo si el equipo lo permite
      const track = stream.getVideoTracks()[0];
      const caps: any = track.getCapabilities?.() ?? {};
      if (caps.focusMode?.includes('continuous')) {
        await track.applyConstraints({advanced: [{focusMode: 'continuous'} as any]}).catch(() => {});
      }

      await this.prepararDetector();
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
        this.erroresSeguidos = 0;
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
          type: 'error',
          summary: 'Escáner',
          detail: 'No se pudo iniciar el lector de códigos',
          autoCloseMs: 3000,
        });
        return;
      }
    }

    this.escaneoTimer = setTimeout(() => void this.leerFrame(video), 150);
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

  private codigoEscaneado(codigo: string) {
    this.cerrarCamara();
    this.barraItem.set(codigo);
    this.mostrarProducto();
  }

  // ---------- lectura desde foto ----------
  abrirSelectorFoto() {
    this.cerrarCamara();   // suelta la cámara en vivo

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');   // en PC se ignora

    input.onchange = () => {
      const file = input.files?.[0];
      if (file) void this.procesarFoto(file);
    };

    input.click();   // debe ejecutarse dentro del clic del usuario, sin await antes
  }

  private async procesarFoto(file: File) {
    this.procesandoFoto.set(true);
    try {
      const texto = await this.leerArchivo(file);
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
      return await this.leerConZxing(this.ctx.getImageData(0, 0, bmp.width, bmp.height));
    } finally {
      bmp.close();
    }
  }
}
