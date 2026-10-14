import {AfterViewInit, Component, ElementRef, inject, OnDestroy, viewChild} from '@angular/core';
import {LocationApiService} from '../../../../core/services/location-api.service';
import {Subscription, switchMap, timer} from 'rxjs';
import * as L from 'leaflet';
import 'leaflet.heat';
import {FormsModule} from '@angular/forms';

// Íconos por defecto de Leaflet (se ejecuta una sola vez al cargar el archivo)
const base = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images';

L.Marker.prototype.options.icon = L.icon({
  iconUrl: `${base}/marker-icon.png`,
  iconRetinaUrl: `${base}/marker-icon-2x.png`,
  shadowUrl: `${base}/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

@Component({
  selector: 'app-mapa-puntos-venta',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './mapa-puntos-venta.component.html',
  styles: ``,
  host: {
    class: 'block'
  }
})
export class MapaPuntosVentaComponent implements AfterViewInit, OnDestroy {

  private mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  private api = inject(LocationApiService);

  usuario = '';
  desde = this.hoyA(0);
  hasta = this.hoyA(23, 59);

  private map!: L.Map;
  private capa = L.layerGroup();
  private enVivo?: Subscription;

  private resizeObserver?: ResizeObserver;

  ngAfterViewInit() {
    this.map = L.map(this.mapContainer().nativeElement).setView([-2.9001, -79.0059], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.capa.addTo(this.map);

    // Corrige el mapa "perdido" o con tiles cortados cuando cambia el tamaño
    // (abrir/cerrar sidebar, rotar el celular, etc.)
    this.resizeObserver = new ResizeObserver(() => this.map.invalidateSize());
    this.resizeObserver.observe(this.mapContainer().nativeElement);

    // Por si el componente se renderiza antes de que el layout termine de medirse
    setTimeout(() => this.map.invalidateSize(), 0);

    this.verUltimas();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.enVivo?.unsubscribe();
    this.map?.remove();
  }

  // ---- Últimas posiciones (se refresca cada 20 s) ----
  verUltimas() {
    this.detenerVivo();
    this.enVivo = timer(0, 20_000)
      .pipe(switchMap(() => this.api.ultimas()))
      .subscribe((lista) => {
        this.capa.clearLayers();
        const bounds: L.LatLngTuple[] = [];
        lista.forEach((u) => {
          const [lng, lat] = u.location.coordinates;
          bounds.push([lat, lng]);
          L.marker([lat, lng])
            .bindPopup(`<b>${u.username}</b><br>${new Date(u.timestamp).toLocaleString()}`)
            .addTo(this.capa);
        });
        if (bounds.length && !this.yaAjustado) {
          this.map.fitBounds(bounds, { padding: [40, 40] });
          this.yaAjustado = true;
        }
      });
  }
  private yaAjustado = false;

  // ---- Recorrido de un vendedor ----
  verRecorrido() {
    if (!this.usuario) return;
    this.detenerVivo();
    this.api
      .recorrido(this.usuario, new Date(this.desde), new Date(this.hasta))
      .subscribe((puntos) => {
        this.capa.clearLayers();
        if (!puntos.length) return;
        const coords = puntos.map((p) => [p.location.coordinates[1], p.location.coordinates[0]] as L.LatLngTuple);
        const linea = L.polyline(coords, { color: '#2563eb', weight: 4 }).addTo(this.capa);
        L.circleMarker(coords[0], { color: 'green', radius: 8 }).bindPopup('Inicio').addTo(this.capa);
        L.circleMarker(coords[coords.length - 1], { color: 'red', radius: 8 }).bindPopup('Fin').addTo(this.capa);
        this.map.fitBounds(linea.getBounds(), { padding: [40, 40] });
      });
  }

  // ---- Mapa de calor ----
  verCalor() {
    if (!this.usuario) return;
    this.detenerVivo();
    this.api
      .recorrido(this.usuario, new Date(this.desde), new Date(this.hasta))
      .subscribe((puntos) => {
        this.capa.clearLayers();
        const data = puntos.map((p) => [p.location.coordinates[1], p.location.coordinates[0], 0.5]);
        (L as any).heatLayer(data, { radius: 20, blur: 15 }).addTo(this.capa);
      });
  }

  private detenerVivo() {
    this.enVivo?.unsubscribe();
    this.enVivo = undefined;
  }

  private hoyA(h: number, m = 0): string {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
