import {Component, input, output} from '@angular/core';
import {AccesoRol} from '../../../../../core/models/acceso-rol';

@Component({
  selector: 'app-accesos-tabla',
  standalone: true,
  imports: [],
  templateUrl: './accesos-tabla.component.html',
  styles: ``
})
export class AccesosTablaComponent {
  accesos = input.required<AccesoRol[]>();
  editar = output<AccesoRol>();
  eliminar = output<AccesoRol>();
}
