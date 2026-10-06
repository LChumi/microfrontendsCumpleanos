import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {getSessionItem} from '../../../../core/utils/storage.utils';
import {CreposicionService} from '../../../../core/services/creposicion.service';
import {Creposicion} from '../../../../core/models/creposicion';
import {Router} from '@angular/router';
import {DatePipe, NgClass} from '@angular/common';
import {PedidoNuevoModalComponent} from '../components/pedido-nuevo-modal/pedido-nuevo-modal.component';
import {BodegaStoreService} from '../../../../core/services/bodega-store.service';

@Component({
  selector: 'app-generar-reposicion',
  standalone: true,
  imports: [
    DatePipe,
    PedidoNuevoModalComponent,
    NgClass
  ],
  templateUrl: './generar-reposicion.component.html',
  styles: ``
})
export class GenerarReposicionComponent implements OnInit{

  private readonly usuarioId = getSessionItem("username")!;
  private readonly router = inject(Router);
  private readonly bodegaStore = inject(BodegaStoreService);
  private readonly creposicionService = inject(CreposicionService);
  private readonly pendientes = signal<Creposicion[]>([]);

  reposiciones = computed(() => {
    const bodegas = this.bodegaStore.bodegas();
    return this.pendientes().map(r => ({
      ...r,
      nombreBodega: bodegas.find(b => b.codigo === r.bodegaId)?.nombre ?? (bodegas.length ? 'Sin bodega' : '—')
    }));
  });
  modalAbierto = signal(false);

  ngOnInit() {
    this.bodegaStore.cargar();
    this.listarPendientes();
  }

  private listarPendientes() {
    this.creposicionService.listarPendientes(1, this.usuarioId).subscribe({
      next: value => {
        this.pendientes.set(value);
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
