import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Empresa} from '../models/empresa';

@Injectable({
  providedIn: 'root'
})
export class AccesoService {

  private url = environment.apiUrl + '/assist'
  private http = inject(HttpClient)

  getEmpresas(usuario: number): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${this.url}/acceso-rol/empresas/${usuario}`)
  }
}
