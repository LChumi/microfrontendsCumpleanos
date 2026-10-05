import {Component, inject, output, signal} from '@angular/core';
import {BodegaSelectComponent} from '../bodega-select/bodega-select.component';
import {GondolaSelectComponent} from '../gondola-select/gondola-select.component';
import {CreposicionService} from '../../../../../core/services/creposicion.service';
import {getSessionItem} from '../../../../../core/utils/storage.utils';
import {Creposicion} from '../../../../../core/models/creposicion';

@Component({
  selector: 'app-pedido-nuevo-modal',
  standalone: true,
  imports: [
    BodegaSelectComponent,
    GondolaSelectComponent
  ],
  templateUrl: './pedido-nuevo-modal.component.html',
  styles: ``
})
export class PedidoNuevoModalComponent {

  private readonly svc = inject(CreposicionService);
  private readonly empresa = +getSessionItem('empresa')!;
  private readonly usuario = getSessionItem('username')!;

  creado = output<number>();
  cancelar = output<void>();

  urgente = signal(false);
  bodegaId = signal<number | null>(null);
  gondolaId = signal<number | null>(null);
  observacion = signal('');
  guardando = signal(false);
  almacenId = signal<number | null>(null);
  error = signal<string | null>(null);

  onBodegaSeleccionada(bodega: any) {
    const id = bodega?.codigo ?? bodega ?? null;
    const almacenId = bodega?.almacen ?? null;
    this.bodegaId.set(id);
    this.almacenId.set(almacenId);
    this.gondolaId.set(null);
  }

  guardar() {
    if (this.guardando()) return;

    const bodegaId = this.bodegaId();
    const almacenId = this.almacenId();
    const esUrgente = this.urgente();
    const gondolaId = this.gondolaId();

    if (!bodegaId || !almacenId) {
      this.error.set('Selecciona una bodega.');
      return;
    }

    if (!esUrgente && gondolaId == null) {
      this.error.set('Selecciona una góndola, o marca el pedido como urgente.');
      return;
    }

    this.error.set(null);
    this.guardando.set(true);

    const crepo: Creposicion = {
      id: { empresa: this.empresa },
      almacenId,
      bodegaId,
      estado: 0,
      estadoGar: 0,
      finalizado: 0,
      gondolaId: esUrgente ? null : gondolaId,
      gondola: null,
      tipo: 1,
      urgente: esUrgente ? 1 : 0,
      usuario: this.usuario,
      observacion: this.observacion().trim(),
    };

    this.svc.generarReposicion(crepo).subscribe({
      next: value => {
        this.guardando.set(false);
        this.creado.emit(value.id.codigo);
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('No se pudo guardar el pedido. Intenta de nuevo.');
      }
    });
  }


  cambiarUrgente(valor: boolean) {
    this.urgente.set(valor);
    this.error.set(null);

    if (valor) this.gondolaId.set(null);
  }
}
