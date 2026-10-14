import {Component, inject} from '@angular/core';
import {LocationTrackerService} from '../../../../core/services/location-tracker.service';
import {GeolocationService} from '../../../../core/services/geolocation.service';
import {LocationApiService} from '../../../../core/services/location-api.service';
import {getSessionItem} from '../../../../core/utils/storage.utils';

@Component({
  selector: 'app-pedido-clientes',
  standalone: true,
  imports: [],
  templateUrl: './pedido-clientes.component.html',
  styles: ``
})
export class PedidoClientesComponent {
  protected readonly usuario = getSessionItem('username')!;
  private geo = inject(GeolocationService);
  private locationApi = inject(LocationApiService);
  tracker = inject(LocationTrackerService);

  async enviarUbiSimluacionfinalizarPedido() {
    try {
      const pos = await this.geo.obtenerPosicionActual();
      this.locationApi.enviarLote(this.usuario, [{
        lat: pos.lat,
        lng: pos.lng,
        accuracy: pos.accuracy,
        timestamp: new Date().toISOString(),
      }]).subscribe({ error: (e) => console.error(e) });
    } catch (e: any) {
      console.error(e.message);
    }
  }
}
