import {Component, ElementRef, EventEmitter, HostListener, inject, OnInit, Output, signal} from '@angular/core';
import {getSessionItem} from '../../../../../core/utils/storage.utils';
import {BodegaWebVService} from '../../../../../core/services/bodega-web-v.service';
import {BodegaWebV} from '../../../../../core/dto/bodega-web-v';

@Component({
  selector: 'app-bodega-select',
  standalone: true,
  imports: [],
  templateUrl: './bodega-select.component.html',
  styles: ``
})
export class BodegaSelectComponent implements OnInit{

  private readonly empresa =  getSessionItem("empresa");
  private readonly usuarioId = getSessionItem("usrId");
  private readonly bodegaService = inject(BodegaWebVService)
  private readonly elementRef = inject(ElementRef)

  @Output() bodegaSeleccionada = new EventEmitter<BodegaWebV>()

  bodegas = signal<BodegaWebV[]>([]);
  bodegaActual = signal<BodegaWebV | null>(null);
  abierto = signal(false)

  ngOnInit(): void {
    this.listarBodegas()
  }

  listarBodegas(){
    if (this.empresa && this.usuarioId){
      this.bodegaService.listarBodegas(Number(this.usuarioId), Number(this.empresa)).subscribe({
        next: value => {
          this.bodegas.set(value)
          if (!this.bodegaActual() && value.length){
            this.bodegaActual.set(value[0]);
          }
        },
        error: () => {
          console.log("Error al obtener las bodegas")
        }
      })
    }
  }

  toggleDropdown() {
    this.abierto.update(v => !v)
  }

  seleccionarBodega(bodega: BodegaWebV) {
    if (this.bodegaActual()?.codigo !== bodega.codigo) {
      this.bodegaActual.set(bodega);
      this.bodegaSeleccionada.emit(bodega);
      this.abierto.set(false);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.abierto() && !this.elementRef.nativeElement.contains(event.target)){
      this.abierto.set(false)
    }
  }

}
