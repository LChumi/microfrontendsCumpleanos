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
    NgClass
  ],
  templateUrl: './dreposicion-aprobacion.component.html',
  styles: ``
})
export class DreposicionAprobacionComponent implements OnInit{

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

  productos = signal<ProductoReposicionDto[]>([])
  loading = signal(true);
  eliminandoId = signal<number | null>(null);
  editandoCanApr = signal<Set<number>>(new Set());
  tieneMinMaxOriginal = signal<Map<number, boolean>>(new Map())
  minMaxAbierto = signal(false);
  minMaxIndexActual = signal<number | null>(null);
  confirmandoEliminarId = signal<number | null>(null);

  minMaxForm = this.fb.group({
    min: [0, Validators.required],
    max: [0, Validators.required],
  });

  form = this.fb.group({ items: this.fb.array<FormGroup>([]) });

  bodega: any;
  almacen: any;
  usrLiquida: any;

  get items(): FormArray { return this.form.get('items') as FormArray; }

  ngOnInit() {
    const usrLiquida = this.route.snapshot.paramMap.get('usrLiquida')!;
    const bodega = this.route.snapshot.paramMap.get('bodega')!;
    const almacen = this.route.snapshot.paramMap.get('almacen')!;
    this.usrLiquida = usrLiquida
    this.bodega= bodega
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

  esDuplicado(p: ProductoReposicionDto): boolean {
    return this.duplicados().has(p.barra);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.minMaxAbierto()) this.cerrarMinMax();
  }

  private cargar(usrLiquida: string): void {
    this.loading.set(true);
    this.dreposicionService.getProductsByUsrLiquida(usrLiquida).subscribe({
      next: productos => {
        this.productos.set(productos);
        this.items.clear();

        const mapa = new Map<number, boolean>();

        productos.forEach(p => {
          const tieneMinMax = p.min != null && p.max != null;
          mapa.set(p.id, tieneMinMax);

          this.items.push(this.fb.group({
            id: [p.id],
            codigoProducto: [p.codigoProducto],
            canApr: [p.canApr, [Validators.required, Validators.min(0)]],
            min: [p.min],
            max: [p.max],
            codigoStock: [p.codigoStock],
            gondola: [p.gonCod],
            creposicion: [p.creposicion]
          }))
          }
        );

        this.tieneMinMaxOriginal.set(mapa)
        this.loading.set(false);
      },
      error: err => {
        console.error('Error cargando productos', err);
        this.loading.set(false);
      }
    })
  }

  esNuevoMinMax(id: number): boolean {
    return !this.tieneMinMaxOriginal().get(id);
  }

  itemForm(index: number): FormGroup {
    return this.items.at(index) as FormGroup;
  }

  estaEditandoCanApr(id: number): boolean{
    return this.editandoCanApr().has(id);
  }

  toggleEditarCanApr(id:number){
    const set = new Set(this.editandoCanApr());
    set.has(id) ? set.delete(id): set.add(id);
    this.editandoCanApr.set(set);
  }

  guardarCanApr(id: number, index: number){
    const item = this.itemForm(index).value;

    const request: ProductoReposicionUpdateDto = {
      codigo: item.id,
      productoId: item.codigoProducto,
      cantidad: item.canApr,
      gondola: null
    }

    this.dreposicionService.updateProdcut(request).subscribe({
      next: () => {
        this.toggleEditarCanApr(id);
      },
      error: err => {
        console.error('Error actualizando cantidad aprobada', err);
      }
    })
  }

  abrirMinMax(index:number){
    const control = this.itemForm(index);
    this.minMaxForm.setValue({
      min: control.value.min,
      max: control.value.max,
    });
    this.minMaxIndexActual.set(index);
    this.minMaxAbierto.set(true)
  }

  cerrarMinMax() {
    this.minMaxAbierto.set(false)
    this.minMaxIndexActual.set(null)
  }

  guardarMinMax(): void {
    if (this.minMaxForm.invalid) return;
    const index = this.minMaxIndexActual();
    if (index === null) return;

    const item = this.itemForm(index).value;
    const { min, max } = this.minMaxForm.value;

    const request$ = this.esNuevoMinMax(item.id)
      ? this.stockOptimoService.crearMinMax(this.buildCreatePayload(item, min!, max!)).pipe(
        map(() => void 0)
      )
      : this.stockOptimoService.updateMinMax(this.buildUpdatePayload(item, min!, max!)).pipe(
        map(() => void 0)
      );

    request$.subscribe({
      next: () => {
        this.itemForm(index).patchValue({ min, max });

        // ya no es "nuevo" una vez guardado, para que si lo vuelve a editar sea update
        const mapa = new Map(this.tieneMinMaxOriginal());
        mapa.set(item.id, true);
        this.tieneMinMaxOriginal.set(mapa);
        this.notif.showToast({
          type: 'success',
          summary: 'Guardado',
          detail: 'Mínimo-Maximo guardado correctamente',
          autoCloseMs: 2000
        })
        this.cerrarMinMax();
      },
      error: err => console.error('Error al guardar min/max', err)
    });
  }

  private buildCreatePayload(item: any, min:number, max: number): StockOptimo{
    return {
      id: {empresa: this.empresa},
      maximo: max,
      minimo: min,
      bodega: this.bodega,
      gondola: item.gonCod ?? 125,
      producto: item.codigoProducto,
      usuario: this.usuarioCodigo
    }
  }

  private buildUpdatePayload(item: any, min: number, max: number): MinMaxUpdateDto{
    return {
      codigo: item.codigoStock,
      empresa: this.empresa,
      maximo: max,
      minimo: min,
    }
  }

  productoActualMinMax(): ProductoReposicionDto | null {
    const index = this.minMaxIndexActual();
    return index != null ? this.productos()[index]: null;
  }

  confirmarEliminar(id: number){
    this.confirmandoEliminarId.set(id);
  }

  cancelarEliminar(){
    this.confirmandoEliminarId.set(null);
  }

  eliminarConfirmado(i: number){
    this.confirmandoEliminarId.set(null);
    this.eliminarItem(i);
  }

  eliminarItem(index: number){
    const item = this.items.at(index).value;
    this.eliminandoId.set(item.id)
    this.dreposicionService.deleteProductoReposicion(item.id, this.empresa).subscribe({
      next: () => {
        this.items.removeAt(index);
        this.productos.set(this.productos().filter(p => p.id !== item.id));
        this.eliminandoId.set(null);
        this.notif.showToast({
          type: 'warning',
          summary: 'Item eliminado',
          detail: 'Producto eliminado de la lista',
          autoCloseMs: 10000
        })
        },
      error: () => this.eliminandoId.set(null),
    });
  }

  finalizarPedido() {
    if (this.form.invalid) return;
    const request: PrePedidoRequestDto = {
      empresa: this.empresa,
      almacen: this.almacen,
      bodega: this.bodega,
      usrLiquida: this.usrLiquida,
      usr: this.usuarioId
    }
    this.creposicionService.generarPrepedido(request).subscribe({
      next: value => {
        this.notif.showAlert({
          type: 'success',
          title: 'Pedido Autorizado',
          message: value.valor,
        })
        this.router.navigate(['/procesos/reposicion/aprobar-pedido']).then(() => {} );
      },
      error: err => console.error('Error al generar prepedido', err)
    })
  }

  cancelar(){
    this.router.navigate(['/procesos/reposicion/aprobar-pedido']).then(() => {})
  }

  protected readonly getUrlImage = getUrlImage;
  protected readonly cargarImagenDefecto = cargarImagenDefecto;
}
