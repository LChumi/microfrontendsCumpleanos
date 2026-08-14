import {Component, inject, OnInit, ViewChild} from '@angular/core';
import {OverlayPanel, OverlayPanelModule} from 'primeng/overlaypanel';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ListCcomprobaVService} from '../../../core/services/list-ccomproba-v.service';
import {ImportacionesService} from '../../../core/services/importaciones.service';
import {SessionService} from '../../../core/services/session.service';
import {SeleccionService} from '../../../core/services/seleccion.service';
import {OrdenCompraListDTO} from '../../../core/dto/orden-compra-list.dto';
import {Items} from '../../../core/dto/items';
import {ClienteService} from '../../../core/services/cliente.service';
import {SolicitudRequestDTO} from '../../../core/dto/solicitud-request.dto';
import {Trancito} from '../../../core/dto/trancito';
import {ModalClienteComponent} from '../../../shared/components/modal-cliente/modal-cliente.component';
import {InputTextModule} from 'primeng/inputtext';
import {TooltipModule} from 'primeng/tooltip';
import {FormsModule} from '@angular/forms';
import {ButtonDirective} from 'primeng/button';
import {Ripple} from 'primeng/ripple';
import {DividerModule} from 'primeng/divider';
import {FileUploadModule} from 'primeng/fileupload';
import {DecimalPipe, NgClass} from '@angular/common';
import {TableModule} from 'primeng/table';
import {ToggleButtonModule} from 'primeng/togglebutton';
import {SkeletonModule} from 'primeng/skeleton';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {DialogModule} from 'primeng/dialog';
import {ScrollTopModule} from 'primeng/scrolltop';
import {SeleccionBodegasComponent} from '../../../shared/components/seleccion-bodegas/seleccion-bodegas.component';
import {
  SeleccionComprobanteComponent
} from '../../../shared/components/seleccion-comprobante/seleccion-comprobante.component';
import {
  DetalleProductoCcoComponent
} from '../../../shared/components/detalle-producto-cco/detalle-producto-cco.component';

@Component({
  selector: 'app-carga-orden-compra',
  standalone: true,
  imports: [
    InputTextModule,
    TooltipModule,
    FormsModule,
    ButtonDirective,
    Ripple,
    DividerModule,
    FileUploadModule,
    NgClass,
    TableModule,
    ToggleButtonModule,
    DecimalPipe,
    SkeletonModule,
    ProgressSpinnerModule,
    OverlayPanelModule,
    ConfirmDialogModule,
    DialogModule,
    ScrollTopModule,
    SeleccionBodegasComponent,
    SeleccionComprobanteComponent,
    DetalleProductoCcoComponent
  ],
  templateUrl: './carga-orden-compra.component.html',
  styles: ``
})
export class CargaOrdenCompraComponent implements OnInit{

  @ViewChild(ModalClienteComponent) modalcliente!: ModalClienteComponent;
  @ViewChild('sciSelect') sciSelect!: OverlayPanel;

  private messageService = inject(MessageService);
  private fileService = inject(ImportacionesService)
  private sessionService = inject(SessionService);
  private listCcomprobaService = inject(ListCcomprobaVService)
  private selectionService = inject(SeleccionService)
  private clienteService = inject(ClienteService);
  private confirmatioService = inject(ConfirmationService)

  uploadedFiles: any[] = [];
  listCco: any[] = [];
  listaOrdenes: OrdenCompraListDTO = {listNotSci: [], listWhitSci: []} as OrdenCompraListDTO;
  listaFinal: Items[] = []

  private idEmpresa: any
  usrId: any;
  sciSelected: any
  cco: any

  tipoDoc: number = 120;

  proveedor = '';
  observacion = '';
  solicitud = '';

  seleccionComprobante = false
  listOrders = false
  loading = false;
  novedadFrozen = false;
  displayDialog = false;

  ngOnInit(): void {
    const context = this.sessionService.getSessionContext();
    this.idEmpresa = context.idEmpresa;
    this.usrId = context.usrId;
  }

  onUpload(event: any) {
    this.loading = true;

    const files: File[] = event.files;

    if (!files || files.length === 0) {
      this.message('warn', 'Error', 'No hay archivos para enviar');
      this.loading = false;
      return;
    }

    const file = files[0]; // solo tomamos el primero si multiple = false

    this.fileService.sendOrder(file, this.idEmpresa, this.sciSelected.id).subscribe({
      next: data => {
        this.listaOrdenes = data;
        this.listOrders = true;
        this.message('info', 'Envío completo', 'Archivo procesado correctamente');
      },
      error: (error) => {
        this.message('error', 'Error al procesar el archivo', error.message);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  message(severity: string, summary: string, detail: string) {
    this.messageService.add({
      severity: severity,
      summary: summary,
      detail: detail
    });
  }

  handleSaveRequest(event: { request: SolicitudRequestDTO, visible: boolean }) {
    this.loading = true;
    this.seleccionComprobante = event.visible
    event.request.items = this.listaFinal
    event.request.ccoRef = this.sciSelected.id
    this.fileService.confirmarOrden(event.request).subscribe({
      next: data => {
        if (data) {
          this.messageService.add({
            severity: 'succes',
            summary: 'Orden Creada',
            detail: `Orden de compra de Importacion Creada satisfactoriamente ${data.comprobante}`,
            life: 3000
          })
          this.reiniciarProceso()
          this.displayDialog = true;
          this.cco = data.cco;
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la orden de importación ' + error.message,
          life: 3000
        });
        this.loading = false
        return;
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

  findSCi() {
    this.listCco = [];
    if (this.solicitud === '') {
      this.message('warn', 'Sin solicitud a buscar', 'Ingrese una solicitud a buscar')
      return
    }

    const sigla = 10003347 //solicitud de importacion codigo

    this.listCcomprobaService.buscar(
      this.idEmpresa, undefined, undefined, undefined, sigla, undefined, undefined, undefined, this.
        solicitud, undefined, undefined, undefined).subscribe({
      next: data => {
        if (data.length === 0) {
          this.message('warn', 'No se encontraron solicitudes', 'Sin resultados')
          this.solicitud = ''
          return
        } else {
          for (let doc of data) {
            if (doc.estado == 2) {
              this.listCco.push({
                id: doc.ccoCodigo,
                description: doc.concepto,
                comprobante: doc.dspComproba,
                proveedor: doc.codclipro
              });
            }
          }
          this.solicitud = ''
        }
      }
    })
  }

  buscarSCI(event: Event) {
    if (this.sciSelected) {
      if (this.solicitud.includes(this.solicitud)) {
        this.solicitud = ''
        this.sciSelect.toggle(event)
      }
    } else {
      this.findSCi();
      this.sciSelect.toggle(event)
    }
  }

  seleccionarSciOrigen(event: any): void {
    this.sciSelect.hide();
    this.sciSelected = event.data;
    this.message('success', 'SCI Seleccionado', this.sciSelected.comprobante)
    this.clienteService.getClienteById(this.idEmpresa, this.sciSelected.proveedor).subscribe({
      next: data => {
        this.proveedor = data.nombre
        this.selectionService.actualizarClienteSeleccionado(data.codigo)
        this.getButtonLabel()
      }
    })
  }

  asignarCCoOrigen(item: Items, tranSeleccionado: Trancito, event: Event) {

    const inputElement = event.target as HTMLInputElement;

    const isChecked = inputElement?.checked ?? false;
    // Desmarcar todos
    item.trancitos?.forEach(tran => {
      tran.seleccionado = false;
    });

    if (isChecked) {
      // Marcar el seleccionado y asignar origen
      tranSeleccionado.seleccionado = true;
      item.ccoOrigen = tranSeleccionado.ccomproba;
    } else {
      // Si se desmarca, limpiar origen
      item.ccoOrigen = null;
    }
  }

  //Registra un nuevo documento
  reiniciarProceso() {
    this.sciSelected = null
    this.listOrders = false
    this.loading = false
    this.observacion = ''
    this.listaFinal = []
  }

  procesarOrden() {
    if (this.observacion === '') {
      this.message('warn', 'Sci sin observacion', 'Ingrese una observacion o numero de tramite')
      return
    } else {
      const listaSci = this.listaOrdenes.listWhitSci
      const listaNoSci = this.listaOrdenes.listNotSci

      const listaFusionada = [...listaNoSci, ...listaSci];

      const todosConOrigen = listaFusionada.every(item => !!item.ccoOrigen);

      if (!todosConOrigen) {
        this.confirmatioService.confirm({
          key: 'sinsci',
          message: 'Algunos productos no cuentan con comprobante asignado se asignaran al documento escogido',
          header: 'Validacion',
          icon: 'pi pi-sync',
          accept: () => {
            listaFusionada.forEach(item => {
              if (!item.ccoOrigen) {
                item.ccoOrigen = this.sciSelected.id;
              }
            })
            this.seleccionComprobante = true
            this.listaFinal = listaFusionada
          },
          reject: () => {
            return
          }
        })
      } else {
        this.seleccionComprobante = true
        this.listaFinal = listaFusionada
      }
    }
  }

}
