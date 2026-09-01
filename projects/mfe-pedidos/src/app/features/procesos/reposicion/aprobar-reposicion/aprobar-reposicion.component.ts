import {Component, computed, inject, signal} from '@angular/core';
import {BodegaSelectComponent} from '../components/bodega-select/bodega-select.component';
import {BodegaWebV} from '../../../../core/dto/bodega-web-v';
import {CreposicionService} from '../../../../core/services/creposicion.service';
import {Creposicion} from '../../../../core/models/creposicion';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'app-aprobar-reposicion',
  standalone: true,
  imports: [
    BodegaSelectComponent,
    DatePipe
  ],
  templateUrl: './aprobar-reposicion.component.html',
  styles: ``
})
export class AprobarReposicionComponent {

  private readonly creposicionService = inject(CreposicionService)

  pedidos = signal<Creposicion[]>([])
  seleccionados = signal<Set<number>>(new Set())
  loading = false;
  bodega: string = ''

  onBodegaSeleccionada(bodega: BodegaWebV): void {
    console.log(bodega)
    this.bodega= bodega.nombre
    this.listarPedidos(bodega.codigo)
  }

  listarPedidos(bodegaId: any){
    this.loading = true
    this.creposicionService.listarPedidos(1,bodegaId,1).subscribe({
      next: data => {
        this.pedidos.set(data);
        this.seleccionados.set(new Set());
        this.loading= false
      },
      error: err => {
        console.error('Error cargando pedidos', err)
        this.loading= false
      }
    })
  }

  todosSeleccionados = computed(() => {
    const pedidos = this.pedidos()
    return pedidos.length > 0 && pedidos.every(p => this.seleccionados().has(p.id.codigo))
  })

  algunoSeleccionado = computed(() => this.seleccionados().size >0);

  totalSeleccionados = computed(() => this.seleccionados().size);

  toggleSeleccion(p: Creposicion){
    const set = new Set(this.seleccionados())
    set.has(p.id.codigo) ? set.delete(p.id.codigo) : set.add(p.id.codigo);
    this.seleccionados.set(set)
  }

  toggleSeleccionarTodos(){
    if (this.todosSeleccionados()){
      this.seleccionados.set(new Set());
    } else {
      this.seleccionados.set(new Set(this.pedidos().map(p => p.id.codigo)))
    }
  }

  estaSeleccionado(p: Creposicion): boolean {
    return this.seleccionados().has(p.id.codigo)
  }

  aprobarSeleccionados(): void {
    const ids = this.pedidosSeleccionados();
    // this.creposicionService.aprobar(ids).subscribe(...)
    console.log('Aprobar', ids);
  }

  anularSeleccionados(): void {
    const ids = this.pedidosSeleccionados();
    // this.creposicionService.anular(ids).subscribe(...)
    console.log('Anular', ids);
  }

  private pedidosSeleccionados(): Creposicion[] {
    return this.pedidos().filter(p => this.seleccionados().has(p.id.codigo))
  }

  verDetalle(p: Creposicion){
    console.log(p)
  }

}
