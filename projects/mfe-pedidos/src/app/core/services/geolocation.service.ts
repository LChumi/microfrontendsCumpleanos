import { Injectable } from '@angular/core';
import {Posicion} from '../models/location/location.models';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  obtenerPosicionActual(): Promise<Posicion> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Tu navegador no soporta geolocalización'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
        }),
        (err) => reject(new Error(this.mensaje(err))),
        { enableHighAccuracy: true, timeout: 30_000, maximumAge: 10_000 }
      );
    });
  }

  private mensaje(err: GeolocationPositionError): string {
    switch (err.code) {
      case err.PERMISSION_DENIED: return 'Debes permitir el acceso a tu ubicación';
      case err.POSITION_UNAVAILABLE: return 'Ubicación no disponible';
      case err.TIMEOUT: return 'Tiempo agotado obteniendo la ubicación';
      default: return 'Error de ubicación';
    }
  }
}
