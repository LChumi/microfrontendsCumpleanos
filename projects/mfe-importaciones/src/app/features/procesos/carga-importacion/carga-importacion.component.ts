import {Component, inject, OnInit} from '@angular/core';
import {MessageService, PrimeTemplate} from 'primeng/api';
import {ComImpService} from '../../../core/services/com-imp.service';
import {ListCcomprobaVService} from '../../../core/services/list-ccomproba-v.service';
import {ComImpV1} from '../../../core/dto/com-imp-v1';
import {ListCcomprobaV} from '../../../core/dto/list-ccomproba-v';
import {Table, TableModule} from 'primeng/table';
import {extraerNumeroDetalle} from '../../../core/utils/validation.utils';
import {ImportacionRequest} from '../../../core/dto/importacionRequest';
import {getSessionItem} from '../../../core/utils/storage.utils';
import {TagModule} from 'primeng/tag';
import {DatePipe} from '@angular/common';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonDirective} from 'primeng/button';
import {Ripple} from 'primeng/ripple';
import {MultiSelectModule} from 'primeng/multiselect';
import {FormsModule} from '@angular/forms';
import {ProgressSpinnerModule} from 'primeng/progressspinner';

@Component({
  selector: 'app-carga-importacion',
  standalone: true,
  imports: [
    PrimeTemplate,
    TagModule,
    DatePipe,
    TableModule,
    InputTextModule,
    ButtonDirective,
    Ripple,
    MultiSelectModule,
    FormsModule,
    ProgressSpinnerModule
  ],
  templateUrl: './carga-importacion.component.html',
  styles: ``
})
export class CargaImportacionComponent implements OnInit{

  private comimpService = inject(ComImpService)
  private listCcomprobaService = inject(ListCcomprobaVService)
  private messageService = inject(MessageService)

  private idEmpresa: any
  private sigla = 10003348 //orden de compra codigo

  listImportaciones: ComImpV1[] = []
  listaOredenes:ListCcomprobaV[] = []
  ordenesCco:any[] = []
  docSelected: ComImpV1 | null = null;
  imporSelected = false;
  loadingOrder = false;

  ngOnInit() {
    const emp =getSessionItem('empresa')
    if (emp){
      this.getImportaciones(Number(emp))
      this.idEmpresa = emp
    }
  }

  getImportaciones(empresa: number){
    this.comimpService.getImportacionPen(empresa).subscribe({
      next: data => {
        this.listImportaciones = data
      }
    })
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains')
  }

  selectedImp(doc: ComImpV1){
    this.docSelected = doc
    this.imporSelected = true;
    this.findSci()
  }

  findSci() {

    if (!this.imporSelected){
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe seleccionar una importacion',
        life: 3000
      })
      return;
    }

    const ordenDetalle = this.docSelected?.impObservaciones;

    if (!ordenDetalle){
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Importación seleccionada no tiene detalle de pedido',
        life: 3000
      });
      return;
    }

    const numero = extraerNumeroDetalle(ordenDetalle);

    if (!numero){
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No se encontró número válido en la observación',
        life: 3000
      });
      return;
    }

    this.loadingOrder = true;
    this.listCcomprobaService.buscar(this.idEmpresa, undefined, undefined,undefined,this.sigla,undefined,undefined,undefined, numero, undefined, 2).subscribe({
      next: data => {
        if (data.length <= 0){
          this.messageService.add({
            severity: 'info',
            summary: 'Orden no encontrada',
            detail: 'No se encontró una orden similar a la importacion listando todas las ordenes',
            life: 3000
          });
          this.listarOrdenes()
        } else {
          this.listaOredenes = data
          this.loadingOrder = false;
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo buscar el comprobante',
          life: 3000
        });
      }
    });
  }

  listarOrdenes(){
    this.listCcomprobaService.buscar(this.idEmpresa, undefined, undefined,undefined,this.sigla,undefined,undefined,undefined, undefined, undefined, 2).subscribe({
      next: data => {
        this.listaOredenes = data
        this.loadingOrder = false;
      }
    })
  }

  agregarOrdenes(){
    if (this.docSelected){
      const impor : ImportacionRequest = {
        ccoImportacion: this.docSelected?.cco,
        ccoOrdenes: this.ordenesCco
      }
      console.log(impor)
    }
  }

}
