import {Component, DestroyRef, ElementRef, inject, input, model, output, viewChild} from '@angular/core';
import { Observable } from "rxjs";
import {ServiceResponse} from '../../../../../core/dto/service-response';
import {NotificationService} from 'shared-notifications';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-excel-upload-button',
  standalone: true,
  imports: [],
  template: `
    <input #excelInput type="file" class="hidden"
           accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
           (change)="onSeleccionado($event)">
    <button type="button"
            [disabled]="deshabilitado() || subiendo()"
            (click)="abrirSelector()"
            [title]="titulo()"
            aria-label="Cargar Excel"
            class="appearance-none border-0 p-0 shadow-none inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 active:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
      @if (subiendo()) {
        <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"></path>
        </svg>
      } @else {
        <svg class="h-5 w-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
             fill="currentColor" viewBox="0 0 24 24">
          <path fill-rule="evenodd"
                d="M9 7V2.221a2 2 0 0 0-.5.365L4.586 6.5a2 2 0 0 0-.365.5H9Zm2 0V2h7a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5h7.586l-.293.293a1 1 0 0 0 1.414 1.414l2-2a1 1 0 0 0 0-1.414l-2-2a1 1 0 0 0-1.414 1.414l.293.293H4V9h5a2 2 0 0 0 2-2Z"
                clip-rule="evenodd"/>
        </svg>
      }
    </button>
  `
})
export class ExcelUploadButtonComponent {

  readonly subir = input.required<(file: File) => Observable<ServiceResponse>>();
  readonly deshabilitado = input(false);
  readonly titulo = input('Cargar productos desde Excel (barra, item, cantidad)');

  /** Enlace bidireccional: el padre lo usa para bloquear otras acciones mientras sube. */
  readonly subiendo = model(false);
  /** Se emite solo si el servidor respondió success = true. */
  readonly cargado = output<void>();

  private readonly notif = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('excelInput');

  abrirSelector() {
    this.inputRef().nativeElement.click();
  }

  onSeleccionado(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';   // permite volver a elegir el mismo archivo
    if (!file || this.deshabilitado() || this.subiendo()) return;

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      this.notif.showToast({
        type: 'warning',
        summary: 'Archivo no válido',
        detail: 'Solo se permiten archivos Excel (.xlsx o .xls)',
        autoCloseMs: 3000,
      });
      return;
    }

    this.subiendo.set(true);

    this.subir()(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: resp => {
          this.subiendo.set(false);
          this.notif.showToast({
            type: resp.success ? 'success' : 'error',
            summary: resp.success ? 'Excel cargado' : 'No se pudo cargar',
            detail: resp.message,
            autoCloseMs: 6000,   // el mensaje puede traer observaciones largas
          });
          if (resp.success) this.cargado.emit();
        },
        error: err => {
          console.error(err);
          this.subiendo.set(false);
          this.notif.showToast({
            type: 'error',
            summary: 'Error',
            detail: 'No se pudo procesar el archivo',
            autoCloseMs: 4000,
          });
        },
      });
  }

}
