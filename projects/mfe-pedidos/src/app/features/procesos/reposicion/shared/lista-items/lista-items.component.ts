import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {ProductoReposicionDto} from '../../../../../core/dto/producto-reposicion.dto';
import {ProductoImagenComponent} from '../../components/producto-imagen/producto-imagen.component';
import {CantidadEditableComponent} from '../../components/cantidad-editable/cantidad-editable.component';
import {EliminarConfirmComponent} from '../../components/eliminar-confirm/eliminar-confirm.component';

export interface CambioCantidad {
  item: ProductoReposicionDto;
  cantidad: number;
}

@Component({
  selector: 'app-lista-items',
  standalone: true,
  imports: [
    ProductoImagenComponent,
    CantidadEditableComponent,
    EliminarConfirmComponent
  ],
  templateUrl: './lista-items.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListaItemsComponent {

  readonly items = input.required<ProductoReposicionDto[]>();
  readonly cargando = input(false);
  readonly resaltadoId = input<number | null>(null);
  readonly eliminandoId = input<number | null>(null);
  readonly mostrarGondola = input(false);
  readonly textoVacio = input('Aún no hay productos.');

  readonly cantidadCambiada = output<CambioCantidad>();
  readonly eliminar = output<number>();
  readonly ampliar = output<string>();

  protected readonly skeletonsDesktop = [1, 2, 3, 4, 5];
  protected readonly skeletonsMobile = [1, 2, 3];
}
