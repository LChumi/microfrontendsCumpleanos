import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Puntoventa} from '../models/puntoventa';

@Injectable({
  providedIn: 'root'
})
export class PuntoventaService {

  private url = `${environment.apiUrl}/models`
  private http = inject(HttpClient)

  listPventas(empresa: number, almacen:number): Observable<Puntoventa[]> {
    return this.http.get<Puntoventa[]>(`${this.url}/punto-venta/listar/${empresa}/${almacen}`)
  }

  getPventa(empresa: number, almacen: number, secuencia: number): Observable<Puntoventa> {
    return this.http.get<Puntoventa>(`${this.url}/punto-venta/get/${empresa}/${almacen}/${secuencia}`)
  }
}
