import {ChangeDetectionStrategy, Component, ElementRef, input, model, output, viewChild} from '@angular/core';

@Component({
  selector: 'app-buscador-barra',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex gap-2 p-3 md:p-4">
      <input #input type="text" [value]="valor()" (input)="valor.set($any($event.target).value)"
             (keyup.enter)="buscar.emit()" placeholder="Código de ítem o barra..."
             [disabled]="deshabilitado()"
             autocomplete="off" autocapitalize="characters" enterkeyhint="search"
             class="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-base uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 md:text-sm">

      <button type="button" [disabled]="deshabilitado()" (click)="camara.emit()"
              aria-label="Escanear con cámara" title="Escanear con cámara"
              class="appearance-none border-0 p-0 shadow-none inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300 disabled:cursor-not-allowed disabled:text-slate-400">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>
        </svg>
      </button>

      <button type="button" [disabled]="deshabilitado()" (click)="buscar.emit()"
              class="appearance-none border-0 shadow-none h-10 shrink-0 whitespace-nowrap rounded-lg bg-blue-500 px-4 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
        {{ buscando() ? 'Buscando...' : 'Buscar' }}
      </button>
    </div>`,
})
export class BuscadorBarraComponent {
  readonly valor = model('');
  readonly deshabilitado = input(false);
  readonly buscando = input(false);

  readonly buscar = output<void>();
  readonly camara = output<void>();

  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

  enfocar() {
    setTimeout(() => this.inputRef().nativeElement.focus());
  }
}
