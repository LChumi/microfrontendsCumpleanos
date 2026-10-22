import {Component, computed, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {DatePipe, NgClass, NgTemplateOutlet} from '@angular/common';
import {getSessionItem} from '../../../../core/utils/storage.utils';
import {Router} from '@angular/router';
import {BodegaStoreService} from '../../../../core/services/bodega-store.service';
import {CreposicionService} from '../../../../core/services/creposicion.service';
import {Creposicion} from '../../../../core/models/creposicion';
import {SolicitudNuevoModalComponent} from '../components/solicitud-nuevo-modal/solicitud-nuevo-modal.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

const RUTA_PEDIDO = '/erp/pedidos/procesos/transferencia/solicitud';
const TIPO_SOLICITUD = 3;

@Component({
  selector: 'app-solicitud-transferencia',
  standalone: true,
  imports: [DatePipe, NgTemplateOutlet, SolicitudNuevoModalComponent, NgClass],
  templateUrl: './solicitud-transferencia.component.html'
})
export class SolicitudTransferenciaComponent implements OnInit {

  private readonly empresa = Number(getSessionItem('empresa'));
  private readonly usuarioId = getSessionItem('username')!;

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly bodegaStore = inject(BodegaStoreService);
  private readonly creposicionService = inject(CreposicionService);

  private readonly pendientes = signal<Creposicion[]>([]);

  readonly seleccionados = signal<Set<number>>(new Set());
  readonly anulando = signal(false);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly modalAbierto = signal(false);

  readonly cantidadSeleccionada = computed(() => this.seleccionados().size);
  readonly algunoSeleccionado = computed(() => this.seleccionados().size > 0);

  readonly solicitudes = computed(() => {
    const bodegas = this.bodegaStore.bodegas();
    const nombreDe = (id: number) =>
      bodegas.find(b => b.codigo === id)?.nombre ?? (bodegas.length ? 'Sin bodega' : '—');

    return this.pendientes().map(r => ({
      ...r,
      nombreBodega: nombreDe(r.bodegaId),
      bodSolicita: nombreDe(r.bodegaId)
    }));
  });

  readonly todosSeleccionados = computed(() => {
    const lista = this.solicitudes();
    const sel = this.seleccionados();
    return lista.length > 0 && lista.every(r => sel.has(r.id.codigo));
  });

  ngOnInit() {
    this.bodegaStore.cargar();
    this.listarSolicitudes();
  }

  private listarSolicitudes(alTerminar?: () => void) {
    this.cargando.set(true);
    this.creposicionService.listarPendientes(TIPO_SOLICITUD, this.usuarioId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: lista => {
          this.pendientes.set(lista);
          // descartar selecciones de pedidos que ya no existen
          const vigentes = new Set(lista.map(r => r.id.codigo));
          this.seleccionados.update(s => new Set([...s].filter(c => vigentes.has(c))));
          this.error.set(null);
          this.cargando.set(false);
          alTerminar?.();
        },
        error: err => {
          console.error(err);
          this.error.set('No se pudieron cargar las solicitudes.');
          this.cargando.set(false);
          alTerminar?.();
        }
      });
  }

  estaSeleccionado(r: Creposicion) {
    return this.seleccionados().has(r.id.codigo);
  }

  toggleSeleccion(r: Creposicion) {
    this.seleccionados.update(s => {
      const n = new Set(s);
      if (!n.delete(r.id.codigo)) n.add(r.id.codigo);
      return n;
    });
  }

  toggleSeleccionarTodos() {
    this.seleccionados.set(
      this.todosSeleccionados()
        ? new Set()
        : new Set(this.solicitudes().map(r => r.id.codigo))
    );
  }

  abrirModal() { this.modalAbierto.set(true); }
  cerrarModal() { this.modalAbierto.set(false); }

  onCreado(codigo: number) {
    this.cerrarModal();
    this.irAPedido(codigo);
  }

  abrirSolicitud(r: Creposicion) {
    this.irAPedido(r.id.codigo);
  }

  private irAPedido(codigo: number) {
    void this.router.navigate([RUTA_PEDIDO, codigo]);
  }

  anularSeleccionados() {
    this.anular([...this.seleccionados()]);
  }

  anularUno(r: Creposicion) {
    this.anular([r.id.codigo]);
  }

  private anular(codigos: number[]) {
    if (!codigos.length || this.anulando()) return;

    const msg = codigos.length === 1
      ? `¿Eliminar la solicitud #${codigos[0]}?`
      : `¿Eliminar ${codigos.length} solicitudes?`;
    if (!confirm(msg)) return;

    this.anulando.set(true);
    this.error.set(null);

    this.creposicionService
      .anularPedidos({empresa: this.empresa, codigos})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.listarSolicitudes(() => this.anulando.set(false)),
        error: err => {
          console.error(err);
          this.error.set('No se pudieron eliminar las solicitudes.');
          this.anulando.set(false);
        }
      });
  }
}
