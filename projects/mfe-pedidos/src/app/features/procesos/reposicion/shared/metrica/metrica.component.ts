import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-metrica',
  standalone: true,
  template: `
    <div class="flex items-baseline justify-between gap-2 rounded-md bg-slate-50 px-2 py-1.5 md:justify-start md:gap-1 md:bg-transparent md:p-0">
      <dt>{{ etiqueta() }}:</dt>
      <dd class="font-semibold" [class.text-red-600]="alerta()" [class.text-slate-800]="!alerta()">
        {{ valor() ?? '0' }}
      </dd>
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricaComponent {
  readonly etiqueta = input.required<string>();
  readonly valor = input<string | number | null>();
  readonly alerta = input(false);
}
