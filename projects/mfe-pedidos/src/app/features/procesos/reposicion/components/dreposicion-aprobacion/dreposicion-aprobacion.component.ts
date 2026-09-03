import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DreposicionService} from '../../../../../core/services/dreposicion.service';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ProductoReposicionDto} from '../../../../../core/dto/producto-reposicion.dto';
import {getSessionItem} from '../../../../../core/utils/storage.utils';
import {CreposicionService} from '../../../../../core/services/creposicion.service';
import {PrePedidoRequestDto} from '../../../../../core/dto/prepedido-request.dto';
import {cargarImagenDefecto, getUrlImage} from '../../../../../core/utils/images.utils';

@Component({
  selector: 'app-dreposicion-aprobacion',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './dreposicion-aprobacion.component.html',
  styles: ``
})
export class DreposicionAprobacionComponent implements OnInit{

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dreposicionService = inject(DreposicionService);
  private readonly creposicionService = inject(CreposicionService);
  private readonly fb = inject(FormBuilder);
  private readonly empresa = getSessionItem("empresa")!;
  private readonly usuarioId = getSessionItem("usrId")!;

  productos = signal<ProductoReposicionDto[]>([])
  loading = signal(true);
  eliminandoId = signal<number | null>(null);
  editandoCanApr = signal<Set<number>>(new Set());

  minMaxAbierto = signal(false);
  minMaxIndexActual = signal<number | null>(null);
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
    const codigo = this.route.snapshot.paramMap.get('codigo')!;
    const almacen = this.route.snapshot.paramMap.get('almacen')!;
    this.usrLiquida = usrLiquida
    this.bodega= codigo
    this.almacen = almacen
    this.cargar(usrLiquida)
  }

  private cargar(usrLiquida: string): void {
    this.loading.set(true);
    this.dreposicionService.getProductsByUsrLiquida(usrLiquida).subscribe({
      next: productos => {
        this.productos.set(productos);
        this.items.clear();
        productos.forEach(p => this.items.push(this.fb.group({
          id: [p.id],
          codigoProducto: [p.codigoProducto],
          canApr: [p.canApr, [Validators.required, Validators.min(0)]],
          min: [p.min],
          max: [p.max],
          }))
        );
        this.loading.set(false);
      },
      error: err => {
        console.error('Error cargando productos', err);
        this.loading.set(false);
      }
    })
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

  guardarMinMax() {
    if (this.minMaxForm.invalid) return;
    const index = this.minMaxIndexActual();
    if (index === null) return;


    this.itemForm(index).patchValue(this.minMaxForm.value);
    this.cerrarMinMax()
  }

  productoActualMinMax(): ProductoReposicionDto | null {
    const index = this.minMaxIndexActual();
    return index != null ? this.productos()[index]: null;
  }

  eliminarItem(index: number){
    const item = this.items.at(index).value;
    this.eliminandoId.set(item.id)
    this.dreposicionService.deleteProductoReposicion(item.id, this.empresa).subscribe({
      next: () => {
        this.items.removeAt(index);
        this.productos.set(this.productos().filter(p => p.id !== item.id));
        this.eliminandoId.set(null);
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
        console.log(value)
        this.router.navigate(['/procesos/reposicion/aprobar-pedido']);
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
