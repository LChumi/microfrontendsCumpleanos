import {Component, inject, OnInit, signal} from '@angular/core';
import {getSessionItem} from '../../../../core/utils/storage.utils';
import {CreposicionService} from '../../../../core/services/creposicion.service';
import {Creposicion} from '../../../../core/models/creposicion';
import {Router} from '@angular/router';
import {DatePipe} from '@angular/common';
import {PedidoNuevoModalComponent} from '../components/pedido-nuevo-modal/pedido-nuevo-modal.component';

@Component({
  selector: 'app-generar-reposicion',
  standalone: true,
  imports: [
    DatePipe,
    PedidoNuevoModalComponent
  ],
  templateUrl: './generar-reposicion.component.html',
  styles: ``
})
export class GenerarReposicionComponent implements OnInit{

  private readonly usuarioId = getSessionItem("username")!;
  private readonly router = inject(Router);

  private readonly creposicionService = inject(CreposicionService);

  reposiciones = signal<Creposicion[]>([]);
  modalAbierto = signal(false);

  ngOnInit() {
    this.listarPendientes();
  }

  private listarPendientes() {
    this.creposicionService.listarPendientes(1, this.usuarioId).subscribe({
      next: value => {
        this.reposiciones.set(value);
      },
      error: error => {
        console.error(error);
      }
    })
  }

  abrirModal() { this.modalAbierto.set(true); }
  cerrarModal() { this.modalAbierto.set(false); }

  onCreado(codigo: number) {
    this.cerrarModal();
    this.router.navigate(['/erp/pedidos/procesos/reposicion/pedido', codigo]).then(() => {});
  }

  abrirPedido(r: Creposicion) {
    this.router.navigate(['/erp/pedidos/procesos/reposicion/pedido', r.id.codigo]).then(() => {});
  }
}
