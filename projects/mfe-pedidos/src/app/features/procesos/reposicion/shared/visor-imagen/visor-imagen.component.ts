import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {cargarImagenDefecto} from '../../../../../core/utils/images.utils';

@Component({
  selector: 'app-visor-imagen',
  standalone: true,
  host: { '(document:keydown.escape)': 'cerrar.emit()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
         role="dialog" aria-modal="true" aria-label="Imagen ampliada"
         (click)="cerrar.emit()">
      <div class="relative max-h-[90vh] max-w-[90vw]" (click)="$event.stopPropagation()">
        <button type="button" (click)="cerrar.emit()" aria-label="Cerrar"
                class="border-0 absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-lg transition hover:bg-slate-100">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <img [src]="src()" alt="Imagen ampliada"
             class="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
             (error)="onImgError($event)">
      </div>
    </div>`,
})
export class VisorImagenComponent {
  readonly src = input.required<string>();
  readonly cerrar = output<void>();

  protected onImgError(e: Event) {
    cargarImagenDefecto(e);
  }
}
