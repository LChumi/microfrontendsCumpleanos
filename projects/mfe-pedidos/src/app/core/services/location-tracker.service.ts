import {inject, Injectable, signal} from '@angular/core';
import {LocationApiService} from './location-api.service';
import {Punto} from '../models/location/location.models';

@Injectable({
  providedIn: 'root'
})
export class LocationTrackerService {

  private api = inject(LocationApiService);
  readonly activo = signal(false);
  readonly error = signal<string | null>(null);

  private watchId: number | null = null;
  private intervalo: ReturnType<typeof setInterval> | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  private buffer: Punto[] = [];
  private ultimo: Punto | null = null;
  private username = '';

  private readonly MIN_METROS = 20;
  private readonly MAX_ACCURACY = 100;
  private readonly ENVIO_MS = 30_000;

  private onVisibility = () => {
    if (!this.activo()) return;
    if (document.visibilityState === 'visible') {
      this.reiniciarWatch();
      this.puntoInmediato();
      this.pedirWakeLock().then(() => {});
    } else {
      this.enviar();
    }
  };

  iniciar(username: string) {
    if (this.activo()) return;
    this.username = username;
    if (!navigator.geolocation) {
      this.error.set('Tu navegador no soporta geolocalización');
      return;
    }
    this.activo.set(true);
    this.error.set(null);
    this.reiniciarWatch();
    this.pedirWakeLock().then(() => {});
    this.intervalo = setInterval(() => this.enviar(), this.ENVIO_MS);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  detener() {
    this.enviar(); // manda lo pendiente
    this.activo.set(false);
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
    if (this.intervalo) clearInterval(this.intervalo);
    this.intervalo = null;
    this.wakeLock?.release();
    this.wakeLock = null;
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  /** Para usar al crear un pedido */
  obtenerPosicionActual(): Promise<{ lat: number; lng: number; accuracy: number }> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
        }),
        reject,
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
      );
    });
  }

  // ---------- internos ----------

  private reiniciarWatch() {
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.agregar(pos),
      (err) => this.error.set(this.mensajeError(err)),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 }
    );
  }

  private puntoInmediato() {
    navigator.geolocation.getCurrentPosition(
      (pos) => this.agregar(pos),
      () => {},
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  private agregar(pos: GeolocationPosition) {
    const p: Punto = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: new Date(pos.timestamp).toISOString(),
    };
    if (p.accuracy > this.MAX_ACCURACY) return;
    if (this.ultimo && this.distanciaM(this.ultimo, p) < this.MIN_METROS) return;
    this.ultimo = p;
    this.buffer.push(p);
  }

  private enviar() {
    if (this.buffer.length === 0) return;
    const lote = this.buffer.splice(0, 500);
    this.api.enviarLote(this.username, lote).subscribe({
      error: () => this.buffer.unshift(...lote),
    });
  }

  private async pedirWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch { /* no es crítico */ }
  }

  private distanciaM(a: Punto, b: Punto): number {
    const R = 6371000;
    const rad = (x: number) => (x * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  private mensajeError(err: GeolocationPositionError): string {
    switch (err.code) {
      case err.PERMISSION_DENIED: return 'Permiso de ubicación denegado';
      case err.POSITION_UNAVAILABLE: return 'Ubicación no disponible';
      case err.TIMEOUT: return 'Tiempo agotado obteniendo la ubicación';
      default: return 'Error de ubicación';
    }
  }
}
