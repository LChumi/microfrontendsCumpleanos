import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Almacen} from '../models/almacen';

@Injectable({
  providedIn: 'root'
})
export class AlmacenService {

  private url = environment.apiUrl + '/models'
  private http = inject(HttpClient)

  listAlamacenes(empresa:number): Observable<Almacen[]> {
    return this.http.get<Almacen[]>(`${this.url}/almacen/${empresa}`)
  }
}
