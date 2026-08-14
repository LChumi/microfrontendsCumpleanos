import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Acceso} from '../models/acceso';

@Injectable({
  providedIn: 'root'
})
export class AccesoService {

  private url = `${environment.apiUrl}/models`
  private http = inject(HttpClient)

  getAcceso(usuario: number, empresa: number): Observable<Acceso>{
    return this.http.get<Acceso>(`${this.url}/acceso/${usuario}/${empresa}`)
  }
}
