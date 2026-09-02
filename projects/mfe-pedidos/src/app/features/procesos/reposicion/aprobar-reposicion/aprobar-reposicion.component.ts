import {Component, computed, inject, signal} from '@angular/core';
import {BodegaSelectComponent} from '../components/bodega-select/bodega-select.component';
import {BodegaWebV} from '../../../../core/dto/bodega-web-v';
import {CreposicionService} from '../../../../core/services/creposicion.service';
import {Creposicion} from '../../../../core/models/creposicion';
import {DatePipe, NgClass} from '@angular/common';
import {Router} from '@angular/router';
import {EmpresaCodigosRequest} from '../../../../core/dto/empresa-codigos-request';
import {getSessionItem} from '../../../../core/utils/storage.utils';
import {DreposicionService} from '../../../../core/services/dreposicion.service';

@Component({
  selector: 'app-aprobar-reposicion',
  standalone: true,
  imports: [
    BodegaSelectComponent,
    DatePipe,
    NgClass
  ],
  templateUrl: './aprobar-reposicion.component.html',
  styles: ``
})
export class AprobarReposicionComponent {

  private readonly creposicionService = inject(CreposicionService)
  private readonly dreposicionService = inject(DreposicionService)
  private readonly router = inject(Router)
  private readonly empresa = getSessionItem("empresa")!;

  pedidos = signal<Creposicion[]>([])
  seleccionados = signal<Set<number>>(new Set())
  loading = false;

  bodega: any;
  almacen: any;

  onBodegaSeleccionada(bodega: BodegaWebV): void {
    this.bodega= bodega.codigo
    this.almacen= bodega.almacen
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
    const seleccionados = this.pedidosSeleccionados();
    if (!seleccionados.length) return;

    const usrLiquida = this.obtenerUsrLiquidaReutilizable(seleccionados);

    if (usrLiquida !== null){
      this.router.navigate(['procesos/reposicion/aprobacion', usrLiquida, this.bodega, this.almacen ]).then(() => {} );
    } else {
      const request: EmpresaCodigosRequest = {
        empresa: this.empresa,
        codigos: seleccionados.map(p => p.id.codigo),
      };
      console.log(request)
      /*this.dreposicionService.generateUsrLiquida(request).subscribe({
        next: value => {
          this.router.navigate(['procesos/reposicion/aprobacion', value, this.bodega, this.almacen ]).then(() => {} );
        }
      })*/
    }

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

  private obtenerUsrLiquidaReutilizable(seleccionados: Creposicion[]): number | null {

    // Si alguno no tiene usrLiquida,
    // no se puede reutilizar una existente.
    if (seleccionados.some(p => !p.usrLiquida)) {
      return null;
    }

    const usrLiquidas = new Set(
      seleccionados.map(p => p.usrLiquida)
    );

    // Hay diferentes usrLiquida entre seleccionados.
    if (usrLiquidas.size !== 1) {
      return null;
    }

    const usrLiquida = [...usrLiquidas][0];

    // Todas las reposiciones que pertenecen
    // a esa liquidación deben estar seleccionadas.
    const deLaLiquidacion = this.pedidos().filter(
      p => p.usrLiquida === usrLiquida
    );

    const seleccionadosIds = new Set(
      seleccionados.map(p => p.id.codigo)
    );

    const todosSeleccionados = deLaLiquidacion.every(
      p => seleccionadosIds.has(p.id.codigo)
    );

    return todosSeleccionados ? usrLiquida : null;
  }

}
