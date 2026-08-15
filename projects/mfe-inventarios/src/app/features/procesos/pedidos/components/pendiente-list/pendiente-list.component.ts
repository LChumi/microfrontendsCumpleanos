import {Component, inject, input, OnInit, signal} from '@angular/core';
import {FacDespedidowebV} from '../../../../../core/dto/fac-despedidoweb-v';
import {GestionPedidosService} from '../../../../../core/services/gestion-pedidos.service';
import {ServiceResponse} from '../../../../../core/dto/service-response';
import {Button, ButtonDirective} from 'primeng/button';
import {DespachoDetalleComponent} from '../despacho-detalle/despacho-detalle.component';
import {Ripple} from 'primeng/ripple';
import {TooltipModule} from 'primeng/tooltip';
import {TagModule} from 'primeng/tag';
import {DatePipe} from '@angular/common';
import {TableModule} from 'primeng/table';

@Component({
  selector: 'app-pendiente-list',
  standalone: true,
  imports: [
    Button,
    DespachoDetalleComponent,
    ButtonDirective,
    Ripple,
    TooltipModule,
    TagModule,
    DatePipe,
    TableModule
  ],
  templateUrl: './pendiente-list.component.html',
  styles: ``
})
export class PendienteListComponent implements OnInit {

  private despachoService = inject(GestionPedidosService)

  pendientes = signal<FacDespedidowebV[]>([]);

  usuarioId = input.required<string>();
  estado = input.required<number>();

  loading = false
  pedidoSeleccionado: FacDespedidowebV | null = null;

  ngOnInit() {
    this.getPendientes();
  }

  getPendientes() {
    this.despachoService.getPendientes(this.usuarioId(), this.estado()).subscribe({
      next: data => {
        this.pendientes.set(data)
      },
      error: err => console.error('Error cargando pendientes', err)
    })
  }

  verPedido(pedido: FacDespedidowebV) {
    this.pedidoSeleccionado = pedido
  }

  cerrarDetalle() {
    this.pedidoSeleccionado = null
  }

  recargar(response: ServiceResponse) {
    if (response.success) {
      this.cerrarDetalle();
      this.getPendientes();
    }
  }

}
