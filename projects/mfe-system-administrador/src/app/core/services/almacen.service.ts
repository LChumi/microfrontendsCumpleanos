import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Almacen} from '../models/almacen';

@Injectable({
  providedIn: 'root'
})
export class AlmacenService {

  private readonly url = `${environment.apiUrl}/system`
  private http = inject(HttpClient)

  getByEmpresa(empresa: number): Observable<Almacen[]>{
    return this.http.get<Almacen[]>(`${this.url}/almacenes/empresa/${empresa}`)
  }
}
