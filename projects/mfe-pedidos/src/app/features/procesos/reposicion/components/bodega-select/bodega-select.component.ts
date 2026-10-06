import {
  Component,
  effect,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  OnInit,
  Output,
  signal,
  untracked
} from '@angular/core';
import {BodegaWebV} from '../../../../../core/dto/bodega-web-v';
import { BodegaStoreService } from "../../../../../core/services/bodega-store.service";

@Component({
  selector: 'app-bodega-select',
  standalone: true,
  imports: [],
  templateUrl: './bodega-select.component.html',
  styles: ``
})
export class BodegaSelectComponent implements OnInit{

  private readonly bodegaStore = inject(BodegaStoreService);
  private readonly elementRef = inject(ElementRef);

  @Output() bodegaSeleccionada = new EventEmitter<BodegaWebV>();

  bodegas = this.bodegaStore.bodegas;          // <- esta línea era la que fallaba
  bodegaActual = signal<BodegaWebV | null>(null);
  abierto = signal(false);

  constructor() {
    effect(() => {
      const lista = this.bodegas();
      if (!untracked(this.bodegaActual) && lista.length) {
        this.bodegaActual.set(lista[0]);
        this.bodegaSeleccionada.emit(lista[0]);
      }
    });
  }

  ngOnInit(): void {
    this.bodegaStore.cargar();
  }

  toggleDropdown() {
    this.abierto.update(v => !v)
  }

  seleccionarBodega(bodega: BodegaWebV) {
    if (this.bodegaActual()?.codigo !== bodega.codigo) {
      this.bodegaActual.set(bodega);
      this.bodegaSeleccionada.emit(bodega);
    }
    this.abierto.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.abierto() && !this.elementRef.nativeElement.contains(event.target)){
      this.abierto.set(false)
    }
  }

}
