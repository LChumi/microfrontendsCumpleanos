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
import {ReactiveFormsModule} from '@angular/forms';
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
import {DatePipe} from '@angular/common';
import {BarcodeScannerComponent} from '../components/barcode-scanner/barcode-scanner.component';
import {ExcelUploadButtonComponent} from '../components/excel-upload-button/excel-upload-button.component';

// TODO: pon aquí la ruta real del listado de solicitudes de transferencia
const RUTA_LISTADO = '/erp/pedidos/procesos/transferencia/nuevo-solicitud';

@Component({
  selector: 'app-solicitud-detalle',
  standalone: true,
  imports: [
    CantidadEditableComponent,
    EliminarConfirmComponent,
    PaginatorModule,
    ProductoImagenComponent,
    ReactiveFormsModule,
    DatePipe,
    BarcodeScannerComponent,
    ExcelUploadButtonComponent
  ],
  templateUrl: './solicitud-detalle.component.html',
  styles: ``
})
export class SolicitudDetalleComponent implements OnInit {

  //  dependencias
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

  //  refs
  readonly buscadorRef = viewChild<ElementRef<HTMLInputElement>>('buscador');
  readonly cantidadRef = viewChild<ElementRef<HTMLInputElement>>('cantidadInput');

  //  datos
  readonly solicitud = signal<Creposicion | null>(null);
  readonly items = signal<ProductoReposicionDto[]>([]);
  readonly cargandoItems = signal(true);

  //  búsqueda
  readonly barraItem = signal('');
  readonly buscando = signal(false);
  readonly encontrados = signal<ProductoReposicionDto[]>([]);
  readonly producto = signal<ProductoReposicionDto | null>(null);

  //  captura del producto
  readonly cantidad = signal(1);
  readonly observacion = signal('');
  readonly agregando = signal(false);

  //  acciones sobre items
  readonly eliminandoId = signal<number | null>(null);
  readonly resaltadoId = signal<number | null>(null);
  private resaltadoTimer: ReturnType<typeof setTimeout> | null = null;

  //  visor / cámara
  readonly imagenAmpliada = signal<string | null>(null);
  readonly camaraAbierta = signal(false);

  //  estado de operaciones
  subiendo = signal(false);
  readonly enviando = signal(false);
  readonly confirmandoEnvio = signal(false);

  //  nombres de bodega
  readonly bodegaRequiere = computed(() => this.nombreBodega(this.solicitud()?.bodegaId));
  readonly bodegaSolicita = computed(() => this.nombreBodega(this.solicitud()?.bodegaFinId));

  //  derivados
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

  //  helpers
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

  //  carga de items
  cargarItems() {
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

  //  búsqueda
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

  //  agregar
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

  //  items
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

  //  enviar solicitud
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

  //  navegación
  regresar() {
    void this.router.navigate([RUTA_LISTADO]);
  }

  //  carga de Excel
  readonly subirExcel = (file: File) => this.dreposicionSvc.uploadFile(file, this.codigo)

  // SCANNER

  abrirCamara() {
    if (this.ocupado()) return;
    this.camaraAbierta.set(true);
  }

  cerrarCamara() {
    this.camaraAbierta.set(false);
  }

  onCodigoEscaneado(codigo: string) {
    this.cerrarCamara()
    this.barraItem.set(codigo);
    this.mostrarProducto()
  }
}
