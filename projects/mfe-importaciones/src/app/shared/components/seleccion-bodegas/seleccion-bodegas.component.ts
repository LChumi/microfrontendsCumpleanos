import {Component, inject, OnInit} from '@angular/core';
import {UsrDto} from '../../../core/dto/usr.dto';
import {SeleccionService} from '../../../core/services/seleccion.service';
import {getSessionItem} from '../../../core/utils/storage.utils';
import {UsrBodService} from '../../../core/services/usr-bod.service';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-seleccion-bodegas',
  standalone: true,
  imports: [
    DropdownModule,
    FormsModule
  ],
  templateUrl: './seleccion-bodegas.component.html',
  styles: ``
})
export class SeleccionBodegasComponent implements OnInit {

  bodegas: UsrDto[] =[]
  bodegaSelected: UsrDto ={} as UsrDto;

  usrBodService = inject(UsrBodService)
  seleccionService = inject(SeleccionService)

  ngOnInit(): void {
    const empresa = Number(getSessionItem("empresa"));
    const usrId = Number(getSessionItem("usrId"));
    if (empresa && usrId) {
    this.usrBodService.listBodegas(usrId,empresa).subscribe({
      next: (result) => {
        this.bodegas = result;
        for (let bodega of this.bodegas) {
          if (bodega.bodDefault){
            this.bodegaSelected = bodega
            this.seleccionService.actualizarBodegaSeleccionada(bodega.codigo);
            break;
          }
        }
      }
    })
  }
}

  onBodegaSelectedChanged(event: any){
    const selectedBodega = event.value;
    this.seleccionService.actualizarBodegaSeleccionada(selectedBodega.codigo);
  }

}
