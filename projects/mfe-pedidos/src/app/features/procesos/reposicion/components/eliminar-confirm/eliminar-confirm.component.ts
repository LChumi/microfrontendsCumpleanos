import {Component, input, output, signal} from '@angular/core';

@Component({
  selector: 'app-eliminar-confirm',
  standalone: true,
  imports: [],
  templateUrl: './eliminar-confirm.component.html',
  styles: ``
})
export class EliminarConfirmComponent {
  eliminando = input(false);
  confirmado = output<void>();
  confirmando = signal(false);

  aceptar() {
    this.confirmando.set(false);
    this.confirmado.emit();
  }
}
