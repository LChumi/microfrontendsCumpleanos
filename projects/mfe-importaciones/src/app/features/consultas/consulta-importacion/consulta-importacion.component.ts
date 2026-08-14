import {AfterViewInit, Component, inject, OnInit, ViewChild} from '@angular/core';
import {getSessionItem} from '../../../core/utils/storage.utils';
import {getCurrentDate} from '../../../core/utils/date.utils';
import {ModalClienteComponent} from '../../../shared/components/modal-cliente/modal-cliente.component';
import {SeleccionService} from '../../../core/services/seleccion.service';
import {ImpProdTrancitoService} from '../../../core/services/imp-prod-trancito.service';
import {ImpProdTrancitoVw} from '../../../core/dto/imp-prod-trancito-vw';
import {TableModule} from 'primeng/table';
import {DropdownModule} from 'primeng/dropdown';
import {CalendarModule} from 'primeng/calendar';
import {Ripple} from 'primeng/ripple';
import {InputTextModule} from 'primeng/inputtext';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-consulta-importacion',
  standalone: true,
  imports: [
    ModalClienteComponent,
    TableModule,
    DropdownModule,
    CalendarModule,
    Ripple,
    InputTextModule,
    FormsModule
  ],
  templateUrl: './consulta-importacion.component.html',
  styles: ``
})
export class ConsultaImportacionComponent implements OnInit, AfterViewInit {
  @ViewChild(ModalClienteComponent) modalcliente!: ModalClienteComponent;

  private impProdTrancitoService = inject(ImpProdTrancitoService);
  private seleccionService = inject(SeleccionService);

  protected impProdTrancitos: ImpProdTrancitoVw[] = []

  private empresa: any;
  protected nroComprobante!: string;
  protected observacion!: string;
  protected fecha: any;
  protected estado: any
  protected estados: any
  protected loading: boolean = false;
  protected proveedor = ''
  protected modalVisible = false;
  protected proveedorId: any;

  ngOnInit(): void {

    this.empresa = getSessionItem("empresa");
    this.estados = [
      {name: 'LIQUIDADO'},
      {name: 'EN PROCESO'},
      {name: 'PRELIQUIDADO PARCIAL'},
      {name: 'ELIMINADO'},
      {name: 'DISTRI. GASTOS'},
      {name: 'RELIQUIDADO TOTAL'},
    ]
  }

  find() {
    this.loading = true;

    const formattedDate = getCurrentDate(this.fecha);
    const nroComprobante = this.nroComprobante ? this.nroComprobante : '';
    const observacion = this.observacion ? this.observacion : '';
    const estado = this.estado?.name ?? null;
    const prov = this.proveedor ? this.proveedorId : null;

    let count = 0;
    if (nroComprobante) count++;
    if (observacion) count++;
    if (estado) count++;
    if (formattedDate) count++;
    if (prov) count++;

    if (count < 1) {
      alert('No se ha seleccionado ningun campo')
      this.loading = false;
      return;
    }

    this.impProdTrancitoService.buscar(
      this.empresa,
      nroComprobante,
      observacion,
      prov,
      formattedDate,
      estado,
    ).subscribe({
      next: (result) => {
        this.loading = false;
        this.impProdTrancitos = result;
        this.proveedorId = null;
        this.estado = null;
        this.proveedor = 'Seleccionar Proveedor'
      }
    })
  }

  getButtonLabel(): string {
    if (this.proveedor == '') {
      return 'Seleccionar Proveedor'
    } else {
      return this.proveedor
    }
  }

  ngAfterViewInit(): void {
    this.modalcliente.onBtnClick.subscribe(visible => {
      this.modalVisible = visible
    })
    this.modalcliente.onChangeProv.subscribe(prov => {
      this.proveedor = prov
      this.seleccionService.clienteSeleccionado$.subscribe(id => {
        this.proveedorId = id
      })
      this.find()
    })
  }

  abrirModal() {
    this.modalVisible = !this.modalVisible;
  }
}
