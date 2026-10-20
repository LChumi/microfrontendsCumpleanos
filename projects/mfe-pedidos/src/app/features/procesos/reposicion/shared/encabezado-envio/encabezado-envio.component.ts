import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';

@Component({
  selector: 'app-encabezado-envio',
  standalone: true,
  host: { '(document:keydown.escape)': 'cancelar.emit()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative flex-1 md:flex-none">
      <button type="button" [disabled]="!puedeEnviar()" (click)="pedir.emit()"
              class="appearance-none border-0 shadow-none inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 md:w-auto">
        @if (enviando()) {
          <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"></path>
          </svg>
          Enviando...
        } @else {
          <svg class="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 15v2a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-2M12 4v12m0-12 4 4m-4-4L8 8"/>
          </svg>
          Enviar
        }
      </button>

      @if (confirmando()) {
        <div class="absolute right-0 top-full z-30 mt-2 w-[calc(100vw-1.5rem)] max-w-xs rounded-lg border border-slate-200 bg-white p-3 shadow-lg md:w-64"
             role="alertdialog">
          <p class="mb-1 text-sm font-medium text-slate-700">{{ pregunta() }}</p>
          <p class="mb-3 text-xs text-slate-500">{{ detalle() }}</p>
          <div class="flex justify-end gap-2">
            <button type="button" (click)="cancelar.emit()"
                    class="border-0 rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 md:py-1.5">No</button>
            <button type="button" (click)="confirmar.emit()"
                    class="border-0 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 md:py-1.5">Sí, enviar</button>
          </div>
        </div>
      }
    </div>`,
})
export class EncabezadoEnvioComponent {
  readonly puedeEnviar = input(false);
  readonly enviando = input(false);
  readonly confirmando = input(false);
  readonly pregunta = input.required<string>();
  readonly detalle = input.required<string>();

  readonly pedir = output<void>();
  readonly cancelar = output<void>();
  readonly confirmar = output<void>();
}
