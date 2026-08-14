import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Dtipodoc} from '../models/dtipodoc';

@Injectable({
  providedIn: 'root'
})
export class DtipodocService {

  private url = `${environment.apiUrl}/models`
  private http = inject(HttpClient)

  getTipoDoc(empresa: number, tpdCodigo: number): Observable<Dtipodoc[]>{
    return this.http.get<Dtipodoc[]>(`${this.url}/dtipodoc/${empresa}/${tpdCodigo}`)
  }
}
