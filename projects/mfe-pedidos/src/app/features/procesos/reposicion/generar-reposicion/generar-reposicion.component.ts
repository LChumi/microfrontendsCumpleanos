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

  private readonly empresa = +getSessionItem('empresa')!;

  private readonly usuarioId = getSessionItem("username")!;
  private readonly router = inject(Router);
  private readonly bodegaStore = inject(BodegaStoreService);
  private readonly creposicionService = inject(CreposicionService);
  private readonly pendientes = signal<Creposicion[]>([]);

  seleccionados = signal<Set<number>>(new Set());
  anulando = signal(false);

  reposiciones = computed(() => {
    const bodegas = this.bodegaStore.bodegas();
    return this.pendientes().map(r => ({
      ...r,
      nombreBodega: bodegas.find(b => b.codigo === r.bodegaId)?.nombre ?? (bodegas.length ? 'Sin bodega' : '—')
    }));
  });
  modalAbierto = signal(false);

  cantidadSeleccionada = computed(() => this.seleccionados().size);
  algunoSeleccionado = computed(() => this.seleccionados().size > 0);
  todosSeleccionados = computed(() => {
    const lista = this.reposiciones();
    return lista.length > 0 && lista.every(r => this.seleccionados().has(r.id.codigo));
  });

  ngOnInit() {
    this.bodegaStore.cargar();
    this.listarPendientes();
  }

  estaSeleccionado(r: Creposicion) {
    return this.seleccionados().has(r.id.codigo);
  }

  toggleSeleccion(r: Creposicion) {
    this.seleccionados.update(s => {
      const n = new Set(s);
      n.has(r.id.codigo) ? n.delete(r.id.codigo) : n.add(r.id.codigo);
      return n;
    });
  }

  toggleSeleccionarTodos() {
    this.seleccionados.set(
      this.todosSeleccionados()
        ? new Set()
        : new Set(this.reposiciones().map(r => r.id.codigo))
    );
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

  anularSeleccionados() {
    this.anular([...this.seleccionados()]);
  }

  anularUno(r: Creposicion) {
    this.anular([r.id.codigo]);
  }

  ir(){
    void this.router.navigate(['/erp/pedidos/procesos/transferencia/nuevo-solicitud']);
  }

  private anular(codigos: number[]) {
    if (!codigos.length || this.anulando()) return;

    const msg = codigos.length === 1
      ? `¿Eliminar el pedido #${codigos[0]}?`
      : `¿Eliminar ${codigos.length} pedidos?`;
    if (!confirm(msg)) return;

    this.anulando.set(true);
    this.creposicionService
      .anularPedidos({empresa: this.empresa, codigos})
      .subscribe({
        next: () => {
          this.seleccionados.update(s => {
            const n = new Set(s);
            codigos.forEach(c => n.delete(c));
            return n;
          });
          this.listarPendientes();
          this.anulando.set(false);
        },
        error: err => {
          console.error(err);
          this.anulando.set(false);
        }
      });
  }

}
