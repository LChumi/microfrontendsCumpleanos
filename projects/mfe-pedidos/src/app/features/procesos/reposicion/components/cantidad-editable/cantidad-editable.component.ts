import {Component, input, output, signal} from '@angular/core';

@Component({
  selector: 'app-cantidad-editable',
  standalone: true,
  imports: [],
  templateUrl: './cantidad-editable.component.html',
  styles: ``
})
export class CantidadEditableComponent {
  solicitada = input.required<number>();
  valor = input.required<number>();
  cambiado = output<number>();
  editando = signal(false);

  guardar(v: string) {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return;
    if (n !== this.valor()) this.cambiado.emit(n);
    this.editando.set(false);
  }
}
