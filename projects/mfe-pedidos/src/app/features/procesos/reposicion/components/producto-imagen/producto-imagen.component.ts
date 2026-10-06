import {Component, computed, input, output} from '@angular/core';
import {cargarImagenDefecto, getUrlImage} from '../../../../../core/utils/images.utils';

@Component({
  selector: 'app-producto-imagen',
  standalone: true,
  imports: [],
  template: `
    <img
      [src]="url()"
      [alt]="alt()"
      [class]="tamano() + ' shrink-0 cursor-pointer rounded-lg border border-slate-200 object-cover'"
      (click)="ampliar.emit(url())"
      (error)="onError($event)">
  `,
  styles: ``
})
export class ProductoImagenComponent {

  barra = input.required<string>();
  alt = input('');
  tamano = input('h-12 w-12');          // tabla: h-12 w-12 · card/producto: h-14 w-14
  ampliar = output<string>();

  url = computed(() => getUrlImage(this.barra()));
  onError(e: Event) { cargarImagenDefecto(e); }
}
