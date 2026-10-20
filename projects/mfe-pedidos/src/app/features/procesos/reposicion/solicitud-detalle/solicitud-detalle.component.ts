import {
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import {PaginatorModule} from 'primeng/paginator';
import {ProductoImagenComponent} from '../components/producto-imagen/producto-imagen.component';
import {ReactiveFormsModule} from '@angular/forms';
import {map, Observable, switchMap, throwError} from 'rxjs';
import {BodegaStoreService} from '../../../../core/services/bodega-store.service';
import {DatePipe} from '@angular/common';
import {BarcodeScannerComponent} from '../components/barcode-scanner/barcode-scanner.component';
import {ExcelUploadButtonComponent} from '../components/excel-upload-button/excel-upload-button.component';
import {EmpresaCodigosRequest} from '../../../../core/dto/empresa-codigos-request';
import {ReposicionBase} from '../shared/reposicion-base';
import {EnvioResultado} from '../../../../core/dto/envio-resultado';
import {MetricaComponent} from '../shared/metrica/metrica.component';
import {ListaItemsComponent} from '../shared/lista-items/lista-items.component';
import {VisorImagenComponent} from '../shared/visor-imagen/visor-imagen.component';
import {BuscadorBarraComponent} from '../shared/buscador-barra/buscador-barra.component';
import {EncabezadoEnvioComponent} from '../shared/encabezado-envio/encabezado-envio.component';

// TODO: pon aquí la ruta real del listado de solicitudes de transferencia
const RUTA_LISTADO = '/erp/pedidos/procesos/transferencia/nuevo-solicitud';

@Component({
  selector: 'app-solicitud-detalle',
  standalone: true,
  imports: [
    PaginatorModule,
    ProductoImagenComponent,
    ReactiveFormsModule,
    DatePipe,
    BarcodeScannerComponent,
    ExcelUploadButtonComponent,
    MetricaComponent,
    ListaItemsComponent,
    VisorImagenComponent,
    BuscadorBarraComponent,
    EncabezadoEnvioComponent
  ],
  templateUrl: './solicitud-detalle.component.html',
  styles: ``
})
export class SolicitudDetalleComponent extends ReposicionBase implements OnInit {

  private readonly bodegaStore = inject(BodegaStoreService);

  protected readonly textoEntidad = 'Solicitud de reposición';
  protected readonly rutaListado = RUTA_LISTADO;

  readonly bodegaRequiere = computed(() => this.nombreBodega(this.pedido()?.bodegaId));
  readonly bodegaSolicita = computed(() => this.nombreBodega(this.pedido()?.bodegaFinId));

  ngOnInit() {
    this.bodegaStore.cargar();
    this.iniciar();
  }

  protected puedeBuscar() {
    const p = this.pedido();
    return !!p?.bodegaId && !!p?.bodegaFinId;
  }

  protected buscarProductos(dato: string) {
    const p = this.pedido()!;
    return this.dreposicionSvc.getProductsByBodegas(p.bodegaId, p.bodegaFinId!, dato);
  }

  protected gondolaParaAgregar() { return null; }

  protected enviar$(): Observable<EnvioResultado> {
    const s = this.pedido()!;
    const req: EmpresaCodigosRequest = { empresa: s.id.empresa, codigos: [s.id.codigo] };

    return this.dreposicionSvc.generateUsrLiquida(req).pipe(
      switchMap(usrLiquida => {
        if (!usrLiquida) {
          return throwError(() => new Error('No se pudo generar el usuario de liquidación'));
        }
        return this.creposicionSvc.generarPrepedido({
          empresa: s.id.empresa, almacen: s.almacenId, bodega: s.bodegaId,
          usrLiquida, usr: this.usuario,
        });
      }),
      map((res): EnvioResultado => {
        const ok = res.valor != null && res.codigo != null;
        return {
          tipo: ok ? 'success' : 'warning',
          titulo: ok ? 'Solicitud aprobada' : 'Solicitud no autorizada',
          detalle: `${res.valor ?? ''}`,
        };
      }),
    );
  }

  private nombreBodega(id?: number | null): string {
    if (!id) return '—';
    const bodegas = this.bodegaStore.bodegas();
    return bodegas.find(b => b.codigo === id)?.nombre ?? (bodegas.length ? 'Sin bodega' : '—');
  }

}
