import {
  Component,
  computed,
  ElementRef, HostListener,
  inject,
  model,
  signal,
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

  seleccionada = model<number | null>(null);

  readonly gondolas = signal<Gondola[]>([]);
  abierto = signal(false);

  gondolaActual = computed(
    () => this.gondolas().find(g => g.id.codigo === this.seleccionada()) ?? null
  );

  seleccionarGondola(gondola: Gondola) {
    this.seleccionada.set(gondola.id.codigo);
    this.abierto.set(false);
  }

  constructor() {
    this.svc
      .getGondolasByUser(this.empresa, this.usuario)
      .subscribe(g => this.gondolas.set(g));
  }

  toggleDropdown() {
    this.abierto.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.abierto() && !this.elementRef.nativeElement.contains(event.target)) {
      this.abierto.set(false);
    }
  }
}
