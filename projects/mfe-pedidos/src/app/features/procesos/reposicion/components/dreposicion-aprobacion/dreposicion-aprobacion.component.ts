import {Component, computed, HostListener, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DreposicionService} from '../../../../../core/services/dreposicion.service';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ProductoReposicionDto} from '../../../../../core/dto/producto-reposicion.dto';
import {getSessionItem} from '../../../../../core/utils/storage.utils';
import {CreposicionService} from '../../../../../core/services/creposicion.service';
import {PrePedidoRequestDto} from '../../../../../core/dto/prepedido-request.dto';
import {cargarImagenDefecto, getUrlImage} from '../../../../../core/utils/images.utils';
import {NgClass} from '@angular/common';
import {StockOptimoService} from '../../../../../core/services/stock-optimo.service';
import {StockOptimo} from '../../../../../core/models/stock-optimo';
import {MinMaxUpdateDto} from '../../../../../core/dto/min-max-update.dto';
import {map} from 'rxjs';
import {ProductoReposicionUpdateDto} from '../../../../../core/dto/producto-reposicion-update.dto';
import {NotificationService} from 'shared-notifications';

@Component({
  selector: 'app-dreposicion-aprobacion',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
  ],
  templateUrl: './dreposicion-aprobacion.component.html',
  styles: ``
})
export class DreposicionAprobacionComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dreposicionService = inject(DreposicionService);
  private readonly creposicionService = inject(CreposicionService);
  private readonly stockOptimoService = inject(StockOptimoService);
  private readonly notif = inject(NotificationService);

  private readonly fb = inject(FormBuilder);
  private readonly empresa = getSessionItem("empresa")!;
  private readonly usuarioCodigo = getSessionItem("usrId")!;
  private readonly usuarioId = getSessionItem("username")!;

  productos = signal<ProductoReposicionDto[]>([]);
  loading = signal(true);
  eliminandoId = signal<number | null>(null);
  editandoCanApr = signal<Set<number>>(new Set());
  tieneMinMaxOriginal = signal<Map<number, boolean>>(new Map());
  minMaxAbierto = signal(false);
  minMaxIdActual = signal<number | null>(null);
  confirmandoEliminarId = signal<number | null>(null);
  imagenAmpliada = signal<string | null>(null);

  minMaxForm = this.fb.group({
    min: [0, Validators.required],
    max: [0, Validators.required],
  });

  form = this.fb.group({items: this.fb.array<FormGroup>([])});

  // Acceso directo (O(1)) al FormGroup de cada producto por su id
  private readonly formsPorId = new Map<number, FormGroup>();

  bodega: any;
  almacen: any;
  usrLiquida: any;

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnInit() {
    const usrLiquida = this.route.snapshot.paramMap.get('usrLiquida')!;
    const bodega = this.route.snapshot.paramMap.get('bodega')!;
    const almacen = this.route.snapshot.paramMap.get('almacen')!;
    this.usrLiquida = usrLiquida
    this.bodega = bodega
    this.almacen = almacen
    this.cargar(usrLiquida)
  }

  duplicados = computed<Set<string>>(() => {
    const conteo = new Map<string, number>();

    this.productos().forEach(p => {
      conteo.set(p.barra, (conteo.get(p.barra) ?? 0) + 1);
    });

    const barrasDuplicadas = new Set<string>();
    conteo.forEach((cantidad, barra) => {
      if (cantidad > 1) barrasDuplicadas.add(barra);
    });

    return barrasDuplicadas;
  });

  hayDuplicados = computed(() => this.duplicados().size > 0);

  totalProductosDuplicados = computed(() => {
    const dup = this.duplicados();
    return this.productos().filter(p => dup.has(p.barra)).length;
  });

  productoActualMinMax = computed<ProductoReposicionDto | null>(() => {
    const id = this.minMaxIdActual();
    if (id === null) return null;
    return this.productos().find(p => p.id === id) ?? null;
  });

  esDuplicado(p: ProductoReposicionDto): boolean {
    return this.duplicados().has(p.barra);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.minMaxAbierto()) this.cerrarMinMax();
    else if (this.imagenAmpliada()) this.cerrarImagen();
    else if (this.confirmandoEliminarId() !== null) this.cancelarEliminar();
  }

  private cargar(usrLiquida: string): void {
    this.loading.set(true);
    this.dreposicionService.getProductsByUsrLiquida(usrLiquida).subscribe({
      next: productos => {
        const conteo = new Map<string, number>();

        productos.forEach(p => conteo.set(p.barra, (conteo.get(p.barra) ?? 0) + 1));

        // Duplicados primero
        const productosOrdenados = [...productos].sort((a, b) => {
          const aDuplicado = (conteo.get(a.barra) ?? 0) > 1;
          const bDuplicado = (conteo.get(b.barra) ?? 0) > 1;

          return Number(bDuplicado) - Number(aDuplicado);
        });

        this.productos.set(productosOrdenados);

        if (this.duplicados().size > 0) {
          this.notif.showToast({
            type: 'warning',
            summary: 'Productos duplicados',
            detail: `Se encontraron ${this.duplicados().size} productos con código duplicado`,
            autoCloseMs: 10000
          });
        }

        this.items.clear();
        this.formsPorId.clear();

        const mapa = new Map<number, boolean>();

        productosOrdenados.forEach(p => {
          const tieneMinMax = p.min != null && p.max != null;
          mapa.set(p.id, tieneMinMax);

          const grupo = this.fb.group({
            id: [p.id],
            codigoProducto: [p.codigoProducto],
            canApr: [p.canApr, [Validators.required, Validators.min(0)]],
            min: [p.min],
            max: [p.max],
            codigoStock: [p.codigoStock],
            gondola: [p.gonCod],
            creposicion: [p.creposicion]
          });

          this.items.push(grupo);
          this.formsPorId.set(p.id, grupo);
        });

        this.tieneMinMaxOriginal.set(mapa);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error cargando productos', err);
        this.loading.set(false);
      }
    });
  }

  esNuevoMinMax(id: number): boolean {
    return !this.tieneMinMaxOriginal().get(id);
  }

  itemForm(id: number): FormGroup {
    return this.formsPorId.get(id)!;
  }

  estaEditandoCanApr(id: number): boolean {
    return this.editandoCanApr().has(id);
  }

  toggleEditarCanApr(id: number) {
    const set = new Set(this.editandoCanApr());
    set.has(id) ? set.delete(id) : set.add(id);
    this.editandoCanApr.set(set);
  }

  verImagen(url: string) {
    this.imagenAmpliada.set(url);
  }

  cerrarImagen() {
    this.imagenAmpliada.set(null);
  }

  guardarCanApr(id: number) {
    const form = this.itemForm(id);
    if (form.invalid) return;

    const item = form.value;

    const request: ProductoReposicionUpdateDto = {
      codigo: item.id,
      productoId: item.codigoProducto,
      cantidad: item.canApr,
      gondola: null
    };

    this.dreposicionService.updateProdcut(request).subscribe({
      next: () => {
        this.toggleEditarCanApr(id);
      },
      error: err => {
        console.error('Error actualizando cantidad aprobada', err);
      }
    });
  }

  abrirMinMax(id: number) {
    const control = this.itemForm(id);
    this.minMaxForm.setValue({
      min: control.value.min,
      max: control.value.max,
    });
    this.minMaxIdActual.set(id);
    this.minMaxAbierto.set(true);
  }

  cerrarMinMax() {
    this.minMaxAbierto.set(false);
    this.minMaxIdActual.set(null);
  }

  guardarMinMax(): void {
    if (this.minMaxForm.invalid) return;
    const id = this.minMaxIdActual();
    if (id === null) return;

    const form = this.itemForm(id);
    const item = form.value;
    const {min, max} = this.minMaxForm.value;

    const request$ = this.esNuevoMinMax(id)
      ? this.stockOptimoService.crearMinMax(this.buildCreatePayload(item, min!, max!)).pipe(
        map(() => void 0)
      )
      : this.stockOptimoService.updateMinMax(this.buildUpdatePayload(item, min!, max!)).pipe(
        map(() => void 0)
      );

    request$.subscribe({
      next: () => {
        form.patchValue({min, max});

        // Ya no es "nuevo" una vez guardado, para que si lo vuelve a editar sea update
        const mapa = new Map(this.tieneMinMaxOriginal());
        mapa.set(id, true);
        this.tieneMinMaxOriginal.set(mapa);

        this.notif.showToast({
          type: 'success',
          summary: 'Guardado',
          detail: 'Mínimo-Máximo guardado correctamente',
          autoCloseMs: 2000
        });
        this.cerrarMinMax();
      },
      error: err => console.error('Error al guardar min/max', err)
    });
  }

  private buildCreatePayload(item: any, min: number, max: number): StockOptimo {
    return {
      id: {empresa: this.empresa},
      maximo: max,
      minimo: min,
      bodega: this.bodega,
      gondola: item.gonCod ?? 125, // código de góndola por defecto
      producto: item.codigoProducto,
      usuario: this.usuarioCodigo
    };
  }

  private buildUpdatePayload(item: any, min: number, max: number): MinMaxUpdateDto {
    return {
      codigo: item.codigoStock,
      empresa: this.empresa,
      maximo: max,
      minimo: min,
    };
  }

  confirmarEliminar(id: number) {
    this.confirmandoEliminarId.set(id);
  }

  cancelarEliminar() {
    this.confirmandoEliminarId.set(null);
  }

  eliminarConfirmado(id: number) {
    this.confirmandoEliminarId.set(null);
    this.eliminarItem(id);
  }

  eliminarItem(id: number) {
    if (this.eliminandoId() !== null) return; // evita doble click mientras se borra

    this.eliminandoId.set(id);
    this.dreposicionService.deleteProductoReposicion(id, this.empresa).subscribe({
      next: () => {
        const idx = this.items.controls.findIndex(c => c.value.id === id);
        if (idx >= 0) this.items.removeAt(idx);
        this.formsPorId.delete(id);

        this.productos.update(lista => lista.filter(p => p.id !== id));

        // Limpieza de estado asociado al producto eliminado
        this.editandoCanApr.update(set => {
          const nuevo = new Set(set);
          nuevo.delete(id);
          return nuevo;
        });
        this.tieneMinMaxOriginal.update(mapa => {
          const nuevo = new Map(mapa);
          nuevo.delete(id);
          return nuevo;
        });

        this.eliminandoId.set(null);

        this.notif.showToast({
          type: 'warning',
          summary: 'Item eliminado',
          detail: 'Producto eliminado de la lista',
          autoCloseMs: 10000
        });
      },
      error: () => this.eliminandoId.set(null),
    });
  }

  finalizarPedido() {
    if (this.form.invalid) return;
    this.loading.set(true);
    const request: PrePedidoRequestDto = {
      empresa: this.empresa,
      almacen: this.almacen,
      bodega: this.bodega,
      usrLiquida: this.usrLiquida,
      usr: this.usuarioId
    };
    this.creposicionService.generarPrepedido(request).subscribe({
      next: value => {
        if (value.valor != null && value.codigo != null){
          const usuarios = this.getUsuariosUnicos().join(', ');
          this.notif.showAlert({
            type: 'success',
            title: 'Pedido Autorizado',
            message: `${value.valor} de ${usuarios}`,
          });
          this.router.navigate(['/erp/pedidos/procesos/aprobar-pedido']).then(() => {
            this.loading.set(false);
          });
        } else {
          this.notif.showAlert({
            type: 'warning',
            title: 'Pedido no autorizado',
            message: `${value.valor}}`,
          });
        }
      },
      error: err => {
        this.notif.showAlert({
          type: 'error',
          title: 'Error al generar el pedido',
          message: `${err}`,
        });
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/erp/pedidos/procesos/aprobar-pedido']).then(() => {
    });
  }

  getUsuariosUnicos(): string[] {
    const lista = this.productos();
    if (!lista || lista.length === 0) return [];

    // Obtener con map los usuarios y Set para eliminar duplicados
    return [...new Set(lista.map(p => p.usuario))];
  }

  protected readonly getUrlImage = getUrlImage;
  protected readonly cargarImagenDefecto = cargarImagenDefecto;
}
