import {Component, inject, Input, OnInit} from '@angular/core';
import {ComprobanteDetalleService} from '../../../../core/services/comprobante-detalle.service';
import {CompraDetalleProductoDto} from '../../../../core/dto/compra-detalle-producto.dto';
import {getSessionItem} from '../../../../core/utils/storage.utils';
import {DfacturaDto} from '../../../../core/dto/dfactura.dto';

@Component({
  selector: 'app-detalle-producto-cco',
  standalone: true,
  imports: [],
  templateUrl: './detalle-producto-cco.component.html',
  styles: ``
})
export class DetalleProductoCcoComponent implements OnInit {
  @Input() ccoCodigo!: string ;

  private comprobanteDetalleService = inject(ComprobanteDetalleService);

  protected sci : CompraDetalleProductoDto = {} as CompraDetalleProductoDto;

  protected empresa: any
  protected cantidadTotal: any;
  protected subtotal: any;
  protected  loading = false;

  ngOnInit(): void {
    const nombre =getSessionItem('nombreEmpresa')
    if (nombre) {
      this.empresa = nombre;
    }
    if (this.ccoCodigo){
      this.getSci(this.ccoCodigo)
    }
  }

  getSci(cco: any){
    this.loading = true;
    this.comprobanteDetalleService.verSci(cco).subscribe({
      next: data => {
        this.sci = data;
        this.cantidadTotal = this.calcularCantidadTotal(data.items);
        this.subtotal = this.calcularPrecioTotal(data.items);
        this.loading = false;
      }
    })
  }

  calcularCantidadTotal(items: DfacturaDto[]): number {
    return items.reduce((total, item) => total + item.cantidad, 0);
  }

  calcularPrecioTotal(items: DfacturaDto[]): number {
    return items.reduce((total, item) => total + item.precio, 0);
  }
}
