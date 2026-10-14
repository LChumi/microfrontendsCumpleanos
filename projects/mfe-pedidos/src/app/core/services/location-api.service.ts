import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {LocationPointDto, Punto, UltimaUbicacion} from "../models/location/location.models";

@Injectable({
  providedIn: 'root'
})
export class LocationApiService {

  private readonly url = `${environment.apiUrl}/mongo/locations`
  private readonly http = inject(HttpClient)

  enviarLote(username: string, puntos: Punto[]) {
    return this.http.post<void>(`${this.url}/batch`, { username, puntos });
  }

  ultimas() {
    return this.http.get<UltimaUbicacion[]>(`${this.url}/last`);
  }

  recorrido(username: string, from: Date, to: Date) {
    const params = new HttpParams()
      .set('username', username)
      .set('from', from.toISOString())
      .set('to', to.toISOString());
    return this.http.get<LocationPointDto[]>(`${this.url}/route`, { params });
  }
}
