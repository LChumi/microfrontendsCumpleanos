import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Tipodoc} from '../models/tipodoc';

@Injectable({
  providedIn: 'root'
})
export class TipodocService {

  private url = `${environment.apiUrl}/models`
  private http = inject(HttpClient)

  listarTipoDocs(): Observable<Tipodoc[]> {
    return this.http.get<Tipodoc[]>(`${this.url}/tipodoc/listar`);
  }
}
