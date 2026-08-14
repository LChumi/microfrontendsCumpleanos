import {AfterViewInit, Component, HostListener, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SeleccionBodegasComponent} from '../../../shared/components/seleccion-bodegas/seleccion-bodegas.component';
import {ButtonDirective} from 'primeng/button';
import {Ripple} from 'primeng/ripple';
import {InputTextModule} from 'primeng/inputtext';
import {FormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {DecimalPipe, NgClass} from '@angular/common';
import {DialogModule} from 'primeng/dialog';
import {FileUploadModule} from 'primeng/fileupload';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {
  SeleccionComprobanteComponent
} from '../../../shared/components/seleccion-comprobante/seleccion-comprobante.component';
import {
  DetalleProductoCcoComponent
} from '../../../shared/components/detalle-producto-cco/detalle-producto-cco.component';
import {ScrollTopModule} from 'primeng/scrolltop';
import {SolicitudRequestDTO} from '../../../core/dto/solicitud-request.dto';
import {Items} from '../../../core/dto/items';
import {forkJoin, Observable} from 'rxjs';
import {getSessionItem} from '../../../core/utils/storage.utils';
import {MessageService} from 'primeng/api';
import {ImportacionesService} from '../../../core/services/importaciones.service';
import {getUrlImage} from '../../../core/utils/image.utils';
import {ModalClienteComponent} from '../../../shared/components/modal-cliente/modal-cliente.component';

@Component({
  selector: 'app-carga-solicitud',
  standalone: true,
  imports: [
    SeleccionBodegasComponent,
    ButtonDirective,
    Ripple,
    InputTextModule,
    FormsModule,
    TableModule,
    DecimalPipe,
    DialogModule,
    NgClass,
    FileUploadModule,
    ProgressSpinnerModule,
    SeleccionComprobanteComponent,
    DetalleProductoCcoComponent,
    ScrollTopModule,
    ModalClienteComponent
  ],
  templateUrl: './carga-solicitud.component.html',
  styles: ``
})
export class CargaSolicitudComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostListener('window:beforeunload', ['$event'])
  @ViewChild(ModalClienteComponent) modalcliente!: ModalClienteComponent;

  private idEmpresa: any
  usrId: any
  protected uploadFiles: any[] = []; // Archivos seleccionados

  private messageService = inject(MessageService);
  private fileService = inject(ImportacionesService)

  listItems: Items[] = []
  item: Items = {} as Items;

  proveedor = ''
  protected imageUrl: string | null = ''

  observacion: string = ''
  cco: any

  modalVisible = false;
  loading = false
  itemDialog = false
  deleteItemDialog = false
  confirmDialog = false
  submitted = false
  seleccionComprobante = false
  displayDialog: boolean = false;

  cantidadAnterior = 0;
  cxbAnterior = 0;
  fobAnterior = 0;
  cbmAnterior = 0;

  ngAfterViewInit() {
    this.modalcliente.onBtnClick.subscribe(visible => {
      this.modalVisible = visible
    })
    this.modalcliente.onChangeProv.subscribe(prov => {
      this.proveedor = prov
    })
  }

  ngOnInit(): void {
    window.addEventListener('beforeunload', this.unloadNotification)
    const empresa = getSessionItem('empresa')
    const usrId: any = getSessionItem('usrId')
    if (empresa && usrId) {
      this.idEmpresa = Number(empresa)
      this.usrId = Number(usrId)
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeunload', this.unloadNotification)
  }

  unloadNotification($event: any) {
    const message = 'Tienes cambios sin guardar. ¿Estas seguro que quieres salir?';
    $event.returnValue = message;
    return message;
  }

  onUpload(event: any) {
    this.loading = true
    const files = event.files

    if (files.length === 0) {
      this.message('warn', 'Error', 'No hay archivos para enviar')
      this.loading = false
      return
    }

    const requests: Observable<Items[]>[] = files.map((file: File) =>
      this.fileService.sendExcel(file, this.idEmpresa)
    );

    forkJoin(requests).subscribe({
      next: (responses: Items[][]) => {
        responses.forEach((response) => {
          if (response.length === 0) {
            this.message('warn', 'Advertencia', 'El archivo está vacío');
          } else {
            this.message('success', 'Envío completo', 'Archivo enviado exitosamente');
          }
        });

        this.listItems = responses.flat();
        this.loading = false;
      },
      error: (error) => {
        this.message('error', 'Error', error.message);
        this.listItems = [];
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });

  }

  message(severity: string, summary: string, detail: string) {
    this.messageService.add({
      severity: severity,
      summary: summary,
      detail: detail
    });
  }

  abrirModal() {
    this.modalVisible = !this.modalVisible;
  }

  getButtonLabel(): string {
    if (this.proveedor == '') {
      return 'Seleccionar Proveedor'
    } else {
      return this.proveedor
    }
  }

  cargarNuevo() {
    this.listItems = []
    this.loading = false
  }

  editItem(item: Items) {
    this.item = {...item}
    this.itemDialog = true
    this.cantidadAnterior = item.cantidad
    this.cbmAnterior = item.cbm
    this.fobAnterior = item.fob
    this.cxbAnterior = item.cxb
  }

  deleteItem(item: Items) {
    this.deleteItemDialog = true
    this.item = {...item}
  }

  confirmDelete() {
    this.deleteItemDialog = false;
    this.listItems = this.listItems.filter(item => item.id !== this.item.id);
    this.messageService.add({severity: 'success', summary: 'Realizado', detail: 'Item Eliminado', life: 3000});
    this.item = {} as Items;
  }

  saveItem() {
    this.submitted = true
    const index = this.findIndexById(this.item.id);
    if (index !== -1) {
      this.item.cantidadTotal = this.item.cantidad * this.item.cxb
      this.item.cbmTotal = this.item.cbm * this.item.cantidad
      this.item.fobTotal = this.item.fob * this.item.cantidadTotal
      this.listItems[index] = this.item;
      this.messageService.add({severity: 'success', summary: 'Realizado', detail: 'Item Actualizado', life: 3000});
    } else {
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'Item no encontrado', life: 3000});
    }
    this.listItems = [...this.listItems];
    this.itemDialog = false;
    this.item = {} as Items;
  }


  hideDialog() {
    this.itemDialog = false
    this.submitted = false
    this.imageUrl = null
  }

  findIndexById(id: string): number {
    let index = -1;
    for (let i = 0; i < this.listItems.length; i++) {
      if (this.listItems[i].id === id) {
        index = i;
        break;
      }
    }
    return index;
  }

  acceptDialog() {
    this.confirmDialog = false;
    this.seleccionComprobante = true;
  }

  handleSaveRequest(event: { request: SolicitudRequestDTO, visible: boolean }) {
    this.loading = true;
    event.request.items = this.listItems
    this.seleccionComprobante = event.visible;
    this.fileService.confirmarSolicitud(event.request).subscribe({
      next: (response) => {
        console.log(response);
        this.observacion = ''
        this.messageService.add({
          severity: 'success',
          summary: 'CREADO',
          detail: 'SOLICITUD DE IMPORTACIÓN: ' + response.comprobante,
          life: 3000
        });
        this.cargarNuevo()
        this.cco = response.cco
        if (this.cco) {
          this.displayDialog = true;
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la solicitud de importación ' + error.message,
          life: 3000
        });
        return;
      }
    })
  }

  protected readonly getUrlImage = getUrlImage;
}
