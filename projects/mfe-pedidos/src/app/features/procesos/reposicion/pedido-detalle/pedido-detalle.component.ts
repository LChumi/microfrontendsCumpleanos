import {Component, computed, ElementRef, inject, signal, viewChild, WritableSignal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CreposicionService} from '../../../../core/services/creposicion.service';
import {DreposicionService} from '../../../../core/services/dreposicion.service';
import {getSessionItem} from '../../../../core/utils/storage.utils';
import {Creposicion} from '../../../../core/models/creposicion';
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
import {map} from 'rxjs';
import {NotificationService} from 'shared-notifications';

@Component({
  selector: 'app-pedido-detalle',
  standalone: true,
  imports: [
    ProductoImagenComponent,
    CantidadEditableComponent,
    EliminarConfirmComponent,
    GondolaSelectComponent,
    ReactiveFormsModule
  ],
  templateUrl: './pedido-detalle.component.html',
  styles: ``
})
export class PedidoDetalleComponent {

  buscadorRef = viewChild<ElementRef<HTMLInputElement>>('buscador');

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly creposicionSvc = inject(CreposicionService);
  private readonly dreposicionSvc = inject(DreposicionService);
  private readonly stockOptimoService = inject(StockOptimoService);
  private readonly notif = inject(NotificationService);          // AJUSTAR al nombre real
  private readonly fb = inject(NonNullableFormBuilder);

  private readonly empresa = +getSessionItem('empresa')!;
  private readonly usuario = getSessionItem('username')!;
  private readonly usuarioCodigo = getSessionItem('username')!;  // AJUSTAR: el que usabas en StockOptimo.usuario
  readonly codigo = +this.route.snapshot.paramMap.get('id')!;

  // datos
  pedido = signal<Creposicion | null>(null);
  items = signal<ProductoReposicionDto[]>([]);

  // búsqueda
  barraItem = signal('');
  buscando = signal(false);
  encontrados = signal<ProductoReposicionDto[]>([]);
  producto = signal<ProductoReposicionDto | null>(null);

  // captura del producto a agregar
  cantidad = signal(1);
  observacion = signal('');
  gondolaId = signal<number | null>(null);
  agregando = signal(false);

  // acciones sobre items
  eliminandoId = signal<number | null>(null);
  resaltadoId = signal<number | null>(null);

  // visor de imagen
  imagenAmpliada = signal<string | null>(null);

  // min / max
  minMaxAbierto = signal(false);
  minMaxForm = this.fb.group({
    min: [0, [Validators.required, Validators.min(0)]],
    max: [0, [Validators.required, Validators.min(0)]],
  });

  yaEnPedido = computed(() => {
    const p = this.producto();
    return !!p && this.items().some(i => i.codigoProducto === p.codigoProducto);
  });

  ngOnInit() {
    this.creposicionSvc.getPedido(this.codigo, this.empresa).subscribe({
      next: p => this.pedido.set(p),
      error: e => console.error(e),
    });
    this.cargarItems();
  }

  private cargarItems() {
    this.dreposicionSvc.getProductsByCreposicion(this.codigo).subscribe({
      next: l => this.items.set(l),
      error: e => console.error(e),
    });
  }

  // ---------- búsqueda ----------
  mostrarProducto() {
    const bodega = this.pedido()?.bodegaId;
    const dato = this.barraItem().trim().toUpperCase();
    if (!bodega || !dato || this.buscando()) return;

    // limpiar el input apenas se busca
    this.barraItem.set('');
    const el = this.buscadorRef()?.nativeElement;
    if (el) { el.value = ''; el.focus(); }
    this.buscadorRef()?.nativeElement.focus();

    // 1) ¿ya está en el pedido? (coincidencia exacta por barra o item)
    const existente = this.buscarEnItems(dato);
    if (existente) {
      this.producto.set(null);
      this.encontrados.set([]);
      this.subirAlInicio(existente.id);
      this.notif.showToast({
        type: 'warning',
        summary: 'Item ya agregado',
        detail: `${existente.item} ya está en el pedido`,
        autoCloseMs: 2500,
      });
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

        // 3) si el backend devolvió uno que ya está en el pedido (por otra barra o código)
        if (lista.length === 1) {
          const dup = this.items().find(i => i.codigoProducto === lista[0].codigoProducto);
          if (dup) {
            this.subirAlInicio(dup.id);
            this.notif.showToast({
              type: 'warning',
              summary: 'Item ya agregado',
              detail: `${dup.item} ya está en el pedido`,
              autoCloseMs: 2500,
            });
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
  }

  cancelarProducto() {
    this.producto.set(null);
    this.encontrados.set([]);
  }

  // ---------- agregar ----------
  agregar() {
    const p = this.producto();
    const cant = this.cantidad();
    if (!p || this.yaEnPedido() || cant <= 0 || this.agregando()) return;
    this.agregando.set(true);

    const d: Dreposicion = {
      id: {empresa: this.empresa},
      creposicionId: this.codigo,
      productoId: p.id,
      cantSol: cant,
      cantApr: cant,
      observacion: this.observacion().trim(),
      gondolaId: this.gondolaId() ?? p.gonCod ?? 125,
      precio: p.precio,
      usuario: this.usuario,
    };

    console.log(d)

    this.dreposicionSvc.addedProduct(d).subscribe({
      next: () => {
        this.agregando.set(false);
        this.producto.set(null);
        this.barraItem.set('');
        this.cargarItems();
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
    const esNuevo = !p.codigoStock;       // AJUSTAR: así detecto que aún no existe stock óptimo

    const request$ = esNuevo
      ? this.stockOptimoService.crearMinMax({
        id: {empresa: this.empresa},
        maximo: max,
        minimo: min,
        bodega,
        gondola: p.gonCod ?? 125,
        producto: p.codigoProducto,
        usuario: this.usuarioCodigo,
      }).pipe(map(r => (r as any).id?.codigo as number | undefined))   // AJUSTAR: dónde viene el código
      : this.stockOptimoService.updateMinMax({
        codigo: p.codigoStock,
        empresa: this.empresa,
        maximo: max,
        minimo: min,
      }).pipe(map(() => p.codigoStock));

    request$.subscribe({
      next: codigoStock => {
        this.producto.set({...p, min, max, codigoStock: codigoStock ?? p.codigoStock});
        this.notif.showToast({
          type: 'success',
          summary: 'Guardado',
          detail: 'Mínimo-Máximo guardado correctamente',
          autoCloseMs: 2000
        });
        this.cerrarMinMax();
      },
      error: err => console.error('Error al guardar min/max', err),
    });
  }

  // ---------- navegación ----------
  regresar() {
    this.router.navigate(['/erp/pedidos/procesos/reposicion/nuevo-pedido']).then(() => {
    });
  }

  // ---------- helpers de template ----------
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

  private subirAlInicio(id: number) {
    this.items.update(l => {
      const idx = l.findIndex(i => i.id === id);
      if (idx <= 0) return l;                 // ya es el primero o no existe
      const copia = [...l];
      const [mov] = copia.splice(idx, 1);
      return [mov, ...copia];
    });
    this.resaltadoId.set(id);
    setTimeout(() => this.resaltadoId.set(null), 2500);
  }

}
