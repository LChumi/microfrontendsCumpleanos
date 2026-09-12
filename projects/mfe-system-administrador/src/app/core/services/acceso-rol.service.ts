import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AccesoRol} from '../models/acceso-rol';

@Injectable({
  providedIn: 'root'
})
export class AccesoRolService {

  private readonly url = `${environment.apiUrl}/system`
  private http = inject(HttpClient)

  getAll(): Observable<AccesoRol[]> {
    return this.http.get<AccesoRol[]>(`${this.url}/acceso-rol/all`)
  }

  getByUserAndAlmacen(usr: number, alm: number): Observable<AccesoRol[]> {
    return this.http.get<AccesoRol[]>(`${this.url}/acceso-rol/user/${usr}/${alm}`)
  }

  getById(id: number): Observable<AccesoRol> {
    return this.http.get<AccesoRol>(`${this.url}/acceso-rol/${id}`)
  }

  create(menu: AccesoRol): Observable<AccesoRol> {
    return this.http.post<AccesoRol>(`${this.url}/acceso-rol`, menu)
  }

  update(menu: AccesoRol): Observable<AccesoRol> {
    return this.http.put<AccesoRol>(`${this.url}/acceso-rol`, menu)
  }
}
