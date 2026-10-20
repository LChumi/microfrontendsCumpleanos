import {Component, computed, inject, output, signal} from '@angular/core';
import {BodegaSelectComponent} from '../bodega-select/bodega-select.component';
import {CreposicionService} from '../../../../../core/services/creposicion.service';
import {getSessionItem} from '../../../../../core/utils/storage.utils';
import {Creposicion} from '../../../../../core/models/creposicion';

const OBSERVACION_DEFAULT = 'SOLICITUD DE TRANSFERENCIA';

@Component({
  selector: 'app-solicitud-nuevo-modal',
  standalone: true,
  imports: [
    BodegaSelectComponent,
  ],
  templateUrl: './solicitud-nuevo-modal.component.html',
  styles: ``
})
export class SolicitudNuevoModalComponent {

  private readonly svc = inject(CreposicionService);
  private readonly empresa = Number(getSessionItem('empresa'));
  private readonly usuario = getSessionItem('username')!;

  readonly creado = output<number>();
  readonly cancelar = output<void>();

  readonly bodegaIni = signal<number | null>(null);
  readonly bodegaFin = signal<number | null>(null);
  readonly almacenId = signal<number | null>(null);
  readonly observacion = signal(OBSERVACION_DEFAULT);
  readonly guardando = signal(false);
  readonly errorServidor = signal<string | null>(null);

  // Validación reactiva: se recalcula sola al cambiar las bodegas
  readonly errorValidacion = computed(() => {
    const ini = this.bodegaIni();
    const fin = this.bodegaFin();
    if (ini && fin && ini === fin) {
      return 'La bodega que requiere y la que solicita no pueden ser la misma.';
    }
    return null;
  });

  readonly error = computed(() => this.errorValidacion() ?? this.errorServidor());

  readonly puedeGuardar = computed(() =>
    !!this.bodegaIni() && !!this.bodegaFin() && !this.errorValidacion() && !this.guardando()
  );

  onBodegaSeleccionada(bodega: any) {
    this.bodegaIni.set(bodega?.codigo ?? bodega ?? null);
    this.almacenId.set(bodega?.almacen ?? null);
    this.errorServidor.set(null);
  }

  onBodegaFinSeleccionada(bodega: any) {
    this.bodegaFin.set(bodega?.codigo ?? bodega ?? null);
    this.errorServidor.set(null);
  }

  guardar() {
    if (!this.puedeGuardar()) return;

    const bodegaIni = this.bodegaIni()!;
    const almacenId = this.almacenId();

    if (!almacenId) {
      this.errorServidor.set('Selecciona la bodega que requiere.');
      return;
    }

    this.errorServidor.set(null);
    this.guardando.set(true);

    const crepo: Creposicion = {
      id: {empresa: this.empresa},
      almacenId,
      bodegaId: bodegaIni,
      bodegaFinId: this.bodegaFin()!,
      estado: 0,
      estadoGar: 0,
      finalizado: 0,
      gondolaId: null,
      gondola: null,
      tipo: 3,
      urgente: 0,
      usuario: this.usuario,
      // si el usuario no escribió nada, va la observación por defecto
      observacion: this.observacion().trim().toUpperCase() || OBSERVACION_DEFAULT,
    };

    this.svc.generarReposicion(crepo).subscribe({
      next: value => {
        this.guardando.set(false);
        this.creado.emit(value.id.codigo);
      },
      error: () => {
        this.guardando.set(false);
        this.errorServidor.set('No se pudo guardar el pedido. Intenta de nuevo.');
      }
    });
  }
}
