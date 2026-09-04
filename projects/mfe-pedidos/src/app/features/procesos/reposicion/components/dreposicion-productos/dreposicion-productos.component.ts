import {Component, inject, input, output} from '@angular/core';
import {ProductoReposicionDto} from '../../../../../core/dto/producto-reposicion.dto';
import {DreposicionService} from '../../../../../core/services/dreposicion.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {cargarImagenDefecto, getUrlImage} from '../../../../../core/utils/images.utils';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {catchError, map, of, startWith, switchMap} from 'rxjs';

@Component({
  selector: 'app-dreposicion-productos',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './dreposicion-productos.component.html',
  styles: ``
})
export class DreposicionProductosComponent {

  creposicion = input.required<number>()
  visible = input(false);
  cerrar = output<void>();

  private readonly drepoService = inject(DreposicionService)

  private readonly resultado$ = toObservable(this.creposicion).pipe(
    switchMap((creposicion) =>
      this.drepoService.getProductsByCreposicion(creposicion).pipe(
        map((productos) => ({ productos, loading: false, error: null as string | null })),
        startWith({ productos: [] as ProductoReposicionDto[], loading: true, error: null as string | null }),
        catchError((err) => {
          console.error('Error al cargar productos:', err);
          return of({ productos: [] as ProductoReposicionDto[], loading: false, error: 'No se pudieron cargar los productos. Intenta nuevamente.' });
        })
      )
    )
  );

  private readonly estado = toSignal(this.resultado$, {
    initialValue: { productos: [] as ProductoReposicionDto[], loading: true, error: null as string | null }
  });

  productos = () => this.estado().productos;
  loading = () => this.estado().loading;
  error = () => this.estado().error;

  cerrarModal(): void {
    this.cerrar.emit();
  }

  protected readonly cargarImagenDefecto = cargarImagenDefecto;
  protected readonly getUrlImage = getUrlImage;
}
