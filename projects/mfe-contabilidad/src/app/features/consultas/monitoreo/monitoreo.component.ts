import {Component, inject, OnInit} from '@angular/core';
import {CtipocomService} from '../../../core/services/ctipocom.service';
import {AlmacenService} from '../../../core/services/almacen.service';
import {TipodocService} from '../../../core/services/tipodoc.service';
import {ListCcomprobaVService} from '../../../core/services/list-ccomproba-v.service';
import {Almacen} from '../../../core/models/almacen';
import {CtipocomDto} from '../../../core/dto/ctipocom.dto';
import {Tipodoc} from '../../../core/models/tipodoc';
import {ListCcomprobaVDto} from '../../../core/dto/list-ccomproba-v.dto';
import {getCurrentDate, getMonthFormattedDate, getYearFormattedDate} from '../../../core/utils/date.utils';
import {getSessionItem} from '../../../core/utils/storage.utils';
import {CalendarModule} from 'primeng/calendar';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';
import {Ripple} from 'primeng/ripple';
import {TableModule} from 'primeng/table';
import {SidebarModule} from 'primeng/sidebar';
import {DialogModule} from 'primeng/dialog';
import {EstadoPipe} from '../../../shared/pipes/estado.pipe';
import {DetalleProductoCcoComponent} from '../components/detalle-producto-cco/detalle-producto-cco.component';

@Component({
  selector: 'app-monitoreo',
  standalone: true,
  imports: [
    CalendarModule,
    DropdownModule,
    FormsModule,
    InputTextModule,
    Ripple,
    TableModule,
    SidebarModule,
    DialogModule,
    EstadoPipe,
    DetalleProductoCcoComponent
  ],
  templateUrl: './monitoreo.component.html',
  styles: ``
})
export class MonitoreoComponent implements OnInit{

  private ctipocomService = inject(CtipocomService);
  private almacenService = inject(AlmacenService);
  private tipodocService = inject(TipodocService);
  private listCcomprobaService = inject(ListCcomprobaVService)

  private empresa: any;
  protected periodo: any;
  protected fecha: any;
  protected mes: any;
  protected sigla: any;
  protected almacen: any;
  protected serie: any;
  protected numero!: number;
  protected concepto!: string;
  protected referencia!: string;
  protected estado!: any;
  protected tipodoc!: any;
  protected estados: any;

  usrId: any
  cco: any
  loading = false;
  visibleSidebarFilters = false;
  displayDialog = false;

  protected almacenes: Almacen[] = [];
  protected siglas: CtipocomDto[] = [];
  protected tipoDocs: Tipodoc[] = [];
  protected listaComprobantes: ListCcomprobaVDto[] = []
  protected almacenSelected: Almacen = {} as Almacen;

  ngOnInit(): void {
    /*this.seoHelper.setupPageSeo({
      title: 'Pagina de consultas monitoreo | Assist web',
      description: 'Consulta o monitoreo de todos los documentos del sistema assist web',
      schemaTitle: 'ContentPage'
    });*/

    this.usrId = getSessionItem('usrId')
    this.empresa = getSessionItem("empresa");
    this.getAlmacenes()
    this.getSiglas()
    this.getDocs()
    this.estados = [
      {name: 'En Proceso', code: 0},
      {name: 'Grabado', code: 1},
      {name: 'Mayorizado', code: 2},
      {name: 'Aut. Final', code: 3},
      {name: 'Anulados', code: 9},
    ]
  }

  onAlmacenChange(event: any) {
    this.almacenSelected = event.value;
  }

  getAlmacenes() {
    if (this.empresa) {
      this.almacenService.listAlamacenes(this.empresa).subscribe({
        next: (result) => {
          this.almacenes = result;
        }
      })
    }
  }

  getSiglas() {
    if (this.empresa) {
      this.ctipocomService.listar(this.empresa).subscribe({
        next: (result) => {
          this.siglas = result;
        }
      })
    }
  }

  getDocs() {
    this.tipodocService.listarTipoDocs().subscribe({
      next: (result) => {
        this.tipoDocs = result;
      }
    })
  }

  find() {
    this.visibleSidebarFilters = false
    this.loading = true;
    const formattedMonth = getMonthFormattedDate(this.mes);
    const formattedYear = getYearFormattedDate(this.periodo);
    const formattedDate = getCurrentDate(this.fecha)

    const sigla = this.sigla ? this.sigla.codigo : null;
    const almacen: any = this.almacenSelected ? this.almacenSelected.codigo : null;
    const estado = this.estado ? this.estado.code : null;
    const tipodoc = this.tipodoc ? this.tipodoc.id : null;

    let count = 0;
    if (sigla) count++;
    if (almacen) count++;
    if (estado) count++;
    if (tipodoc) count++;
    if (formattedYear) count++;
    if (formattedMonth) count++;
    if (this.serie) count++;
    if (this.numero) count++;
    if (formattedDate) count++;
    if (this.concepto) count++;

    // Verificar que al menos dos parámetros estén presentes
    if (count < 2) {
      alert('Por favor, completa al menos dos campos');
      this.loading = false;
      return;
    }

    this.listCcomprobaService.buscar(
      this.empresa,
      formattedYear,
      formattedDate,
      formattedMonth,
      sigla,
      almacen,
      this.serie,
      this.numero,
      this.concepto,
      this.referencia,
      estado,
      tipodoc
    ).subscribe({
      next: (result) => {
        this.listaComprobantes = result;
        this.loading = false;
      }, error: () => {
        this.loading = false;
        this.listaComprobantes = []
      }
    });
  }

  verDocumento(cco: any) {
    if (cco.length > 0) {
      this.cco = cco;
      this.displayDialog = true;
    }
  }
}
