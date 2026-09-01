import { Component } from '@angular/core';
import {BodegaSelectComponent} from '../components/bodega-select/bodega-select.component';
import {BodegaWebV} from '../../../../core/dto/bodega-web-v';

@Component({
  selector: 'app-aprobar-reposicion',
  standalone: true,
  imports: [
    BodegaSelectComponent
  ],
  templateUrl: './aprobar-reposicion.component.html',
  styles: ``
})
export class AprobarReposicionComponent {

  onBodegaSeleccionada(bodega: BodegaWebV): void {
    console.log('Bodega seleccionada:', bodega);
  }

}
