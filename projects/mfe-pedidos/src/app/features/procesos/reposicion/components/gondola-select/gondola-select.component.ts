import {
  Component,
  computed,
  effect,
  ElementRef, HostListener,
  inject,
  input,
  model,
  signal,
  untracked
} from '@angular/core';
import {GondolaService} from '../../../../../core/services/gondola.service';
import {getSessionItem} from '../../../../../core/utils/storage.utils';
import {Gondola} from '../../../../../core/models/gondola';

@Component({
  selector: 'app-gondola-select',
  standalone: true,
  imports: [],
  templateUrl: './gondola-select.component.html',
  styles: ``
})
export class GondolaSelectComponent {
  private readonly svc = inject(GondolaService);
  private readonly elementRef = inject(ElementRef);

  private readonly empresa = +getSessionItem('empresa')!;
  private readonly usuario = +getSessionItem('usrId')!;

  bodegaId = input<number | null>(null);
  seleccionada = model<number | null>(null);

  private readonly todas = signal<Gondola[]>([]);
  abierto = signal(false);

  filtradas = computed(() => {
    const bodega = this.bodegaId();
    return bodega ? this.todas().filter(g => g.bodega === bodega) : [];
  });

  // El nombre sale de un signal, igual que en bodega
  gondolaActual = computed(
    () => this.filtradas().find(g => g.id.codigo === this.seleccionada()) ?? null
  );

  seleccionarGondola(gondola: Gondola | null) {
    this.seleccionada.set(gondola?.id.codigo ?? null);
    this.abierto.set(false);
  }

  constructor() {
    effect(onCleanup => {
      const bodega = this.bodegaId();

      untracked(() => {
        this.seleccionada.set(null);
        this.todas.set([]);
        this.abierto.set(false);
      });

      if (!bodega) return;

      const sub = this.svc
        .getGondolasByUser(this.empresa, this.usuario, bodega)
        .subscribe(gondolas => this.todas.set(gondolas));

      // Cancela la petición anterior si la bodega cambia rápido
      onCleanup(() => sub.unsubscribe());
    });
  }

  toggleDropdown() {
    if (!this.bodegaId()) return;
    this.abierto.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.abierto() && !this.elementRef.nativeElement.contains(event.target)) {
      this.abierto.set(false);
    }
  }
}
