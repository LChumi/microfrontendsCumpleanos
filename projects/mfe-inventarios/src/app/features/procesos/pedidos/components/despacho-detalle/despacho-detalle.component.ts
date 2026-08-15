import {Component, EventEmitter, inject, Input, OnInit, Output, signal} from '@angular/core';
import {Button} from 'primeng/button';
import {DividerModule} from 'primeng/divider';
import {InputNumberModule} from 'primeng/inputnumber';
import {FormsModule} from '@angular/forms';
import {TagModule} from 'primeng/tag';
import {CurrencyPipe, DatePipe} from '@angular/common';
import {ImageModule} from 'primeng/image';
import {TooltipModule} from 'primeng/tooltip';
import {TableModule} from 'primeng/table';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {getUrlImage} from '../../../../../core/utils/images.utils';
import {FacDesprodWebV} from '../../../../../core/dto/fac-desprod-web-v';
import {PedidoHojaId} from '../../../../../core/models/pedido-hoja-id';
import {FacDespedidowebV} from '../../../../../core/dto/fac-despedidoweb-v';
import {ServiceResponse} from '../../../../../core/dto/service-response';
import {ConfirmationService, MessageService} from 'primeng/api';
import {GestionPedidosService} from '../../../../../core/services/gestion-pedidos.service';
import {PedidoHojaService} from '../../../../../core/services/pedido-hoja.service';

@Component({
  selector: 'app-despacho-detalle',
  standalone: true,
  imports: [
    Button,
    DividerModule,
    InputNumberModule,
    FormsModule,
    TagModule,
    CurrencyPipe,
    ImageModule,
    TooltipModule,
    TableModule,
    ConfirmDialogModule,
    DatePipe
  ],
  templateUrl: './despacho-detalle.component.html',
  styles: ``
})
export class DespachoDetalleComponent implements OnInit {

  private gestionPedidoService = inject(GestionPedidosService)
  private pedidoHojaSerice = inject(PedidoHojaService)
  private confirmacionService = inject(ConfirmationService)
  private messageService = inject(MessageService)

  productos = signal<FacDesprodWebV[]>([])

  @Output() finalizar = new EventEmitter<ServiceResponse>();
  @Input() pedido!: FacDespedidowebV;

  loading = false

  ngOnInit() {
    this.getProductosDespacho()
  }

  getProductosDespacho() {
    this.loading = true
    if (this.pedido.hoja) {
      this.gestionPedidoService.getProductos(
        this.pedido.empresa,
        this.pedido.ccoCodigo,
        this.pedido.hoja
      ).subscribe({
        next: data => this.productos.set(data),
        error: err => console.error('Error cargando los productos despacho', err),
        complete: () => this.loading = false
      });
    } else {
      this.gestionPedidoService.getProductos(
        this.pedido.empresa,
        this.pedido.ccoCodigo
      ).subscribe({
        next: data => this.productos.set(data),
        error: err => console.error('Error cargando los productos despacho', err),
        complete: () => this.loading = false
      });
    }
  }

  confirmarDespacho() {

    const productos = this.productos()

    const tieneCero = productos.some(p => p.canapr === 0);

    const mensaje = tieneCero
      ? '¡Algunos productos tienen cantidad en 0! ¿Desea validar el despacho igualmente?'
      : '¿Desea validar el despacho?';

    this.confirmacionService.confirm({
      key: 'validarDespacho',
      header: 'Confirmar Despacho',
      message: mensaje,
      icon: 'pi pi-exclamation-circle',
      acceptLabel: 'Validar',
      rejectLabel: 'Cancelar',
      accept: () => this.finalizarDespacho()
    });
  }

  finalizarDespacho() {
    const id: PedidoHojaId = {
      empresa: this.pedido.empresa,
      ccoComproba: this.pedido.ccoCodigo,
      hoja: this.pedido.hoja
    }
    this.pedidoHojaSerice.updateHojaEstado(id, 2).subscribe({
      next: response => {
        if (response.success) {
          this.finalizar.emit(response)
          this.messageService.add({
            summary: 'Despacho Validado',
            severity: 'info',
            icon: 'pi pi-check',
            detail: 'El despacho fue validado con exito'
          })
        }
      }
    })
  }

  private actualizarCantidad(
    producto: FacDesprodWebV,
    mensaje: { summary: string; detail: string }
  ) {
    this.gestionPedidoService.addCantidad(producto).subscribe({
      next: response => {
        if (response.success) {
          this.messageService.add({
            summary: mensaje.summary,
            severity: 'info',
            icon: 'pi pi-check',
            detail: mensaje.detail
          });
        }
      },
      error: err => {
        this.messageService.add({
          summary: 'Error',
          severity: 'error',
          icon: 'pi pi-times',
          detail: 'No se pudo actualizar la cantidad'
        });
        console.error(err);
      }
    });
  }

  agregarCantidad(producto: FacDesprodWebV) {
    producto.editando = false;
    this.actualizarCantidad(producto, {
      summary: 'Cantidad agregada',
      detail: 'Cantidad agregada correctamente'
    });
  }

  completar(producto: FacDesprodWebV) {
    producto.canapr = producto.cdigitada;
    producto.editando = false;
    this.actualizarCantidad(producto, {
      summary: 'Cantidad completa',
      detail: 'Producto completado'
    });
  }

  toggleEditar(producto: any): void {
    producto.editando = true;
  }

  protected readonly getUrlImage = getUrlImage;
}
