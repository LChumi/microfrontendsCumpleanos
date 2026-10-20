import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {getSessionItem} from '../../../../core/utils/storage.utils';
import {ProductoImagenComponent} from '../components/producto-imagen/producto-imagen.component';
import {CantidadEditableComponent} from '../components/cantidad-editable/cantidad-editable.component';
import {EliminarConfirmComponent} from '../components/eliminar-confirm/eliminar-confirm.component';
import {GondolaSelectComponent} from '../components/gondola-select/gondola-select.component';
import {StockOptimoService} from '../../../../core/services/stock-optimo.service';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {map, Observable} from 'rxjs';
import {BarcodeScannerComponent} from '../components/barcode-scanner/barcode-scanner.component';
import {ExcelUploadButtonComponent} from '../components/excel-upload-button/excel-upload-button.component';
import {ReposicionBase} from '../shared/reposicion-base';
import {EnvioResultado} from '../../../../core/dto/envio-resultado';
import {MetricaComponent} from '../shared/metrica/metrica.component';
import {ListaItemsComponent} from '../shared/lista-items/lista-items.component';
import {VisorImagenComponent} from '../shared/visor-imagen/visor-imagen.component';
import {BuscadorBarraComponent} from '../shared/buscador-barra/buscador-barra.component';
import {EncabezadoEnvioComponent} from '../shared/encabezado-envio/encabezado-envio.component';

@Component({
  selector: 'app-pedido-detalle',
  standalone: true,
  imports: [
    ProductoImagenComponent,
    GondolaSelectComponent,
    ReactiveFormsModule,
    BarcodeScannerComponent,
    ExcelUploadButtonComponent,
    MetricaComponent,
    ListaItemsComponent,
    VisorImagenComponent,
    BuscadorBarraComponent,
    EncabezadoEnvioComponent,
  ],
  templateUrl: './pedido-detalle.component.html',
  styles: `
  `
})
export class PedidoDetalleComponent extends ReposicionBase implements OnInit {

  private readonly stockOptimoService = inject(StockOptimoService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly usuarioCodigo = getSessionItem('usrId')!;

  protected readonly textoEntidad = 'el pedido';
  protected readonly rutaListado = '/erp/pedidos/procesos/reposicion/nuevo-pedido';

  gondolaId = signal<number | null>(null);
  readonly minMaxAbierto = signal(false);
  readonly minMaxForm = this.fb.group({
    min: [0, [Validators.required, Validators.min(0)]],
    max: [0, [Validators.required, Validators.min(0)]],
  });

  readonly esUrgente = computed(() => this.pedido()?.urgente === 1);
  readonly gondolaPedidoNombre = computed(() => this.pedido()?.gondola?.nombre ?? null);

  readonly gondolaDestino = computed<number | null>(() => {
    const porDefecto = this.producto()?.gonCod ?? null;
    const ped = this.pedido();
    if (!ped) return porDefecto;
    return this.esUrgente()
      ? (this.gondolaId() ?? porDefecto)
      : ((ped.gondolaId as number | null) ?? porDefecto);
  });

  ngOnInit() { this.iniciar(); }

  protected override onProductoSeleccionado() { this.gondolaId.set(null); }
  protected puedeBuscar() { return !!this.pedido()?.bodegaId; }
  protected buscarProductos(dato: string) {
    return this.dreposicionSvc.getProduct(this.pedido()!.bodegaId, dato);
  }
  protected gondolaParaAgregar() { return this.gondolaDestino(); }

  protected enviar$(): Observable<EnvioResultado> {
    return this.creposicionSvc.generarSolicitud({ codigo: this.codigo, empresa: this.empresa }).pipe(
      map(resp => {
        if (!resp.success) throw new Error(resp.message || 'Intenta de nuevo');
        return {
          tipo: 'success' as const,
          titulo: 'Pedido enviado',
          detalle: resp.message || `El pedido #${this.codigo} fue enviado para aprobación`,
        };
      }),
    );
  }

  // ---------- min / max ----------
  abrirMinMax() {
    const p = this.producto();
    if (!p) return;
    this.minMaxForm.setValue({min: p.min ?? 0, max: p.max ?? 0});
    this.minMaxAbierto.set(true);
  }

  cerrarMinMax() {
    this.minMaxAbierto.set(false);
  }

  guardarMinMax() {
    const p = this.producto();
    const bodega = this.pedido()?.bodegaId;
    if (!p || !bodega || this.minMaxForm.invalid) return;

    const {min, max} = this.minMaxForm.getRawValue();
    const esNuevo = !p.codigoStock;

    const request$ = esNuevo
      ? this.stockOptimoService.crearMinMax({
        id: {empresa: this.empresa},
        maximo: max,
        minimo: min,
        bodega,
        gondola: this.gondolaDestino(),
        producto: p.id,
        usuario: this.usuarioCodigo,
        creaUsr: this.usuario,
      }).pipe(map(r => (r as any).id?.codigo as number | undefined))   // AJUSTAR: dónde viene el código
      : this.stockOptimoService.updateMinMax({
        codigo: p.codigoStock,
        empresa: this.empresa,
        maximo: max,
        minimo: min,
        usr: this.usuario
      }).pipe(map(() => p.codigoStock));

    request$.subscribe({
      next: codigoStock => {
        this.producto.set({...p, min, max, codigoStock: codigoStock ?? p.codigoStock});
        this.notif.showToast({
          type: 'success',
          summary: 'Guardado',
          detail: 'Mínimo-Máximo guardado correctamente',
          autoCloseMs: 2000,
        });
        this.cerrarMinMax();
      },
      error: err => console.error('Error al guardar min/max', err),
    });
  }
}
