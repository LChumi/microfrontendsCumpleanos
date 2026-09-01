import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {BodegaWebV} from '../dto/bodega-web-v';

@Injectable({
  providedIn: 'root'
})
export class BodegaWebVService {

  private url = `${environment.apiUrl}/pedidos`
  private http = inject(HttpClient)

  listarBodegas(usuario: number, empresa: number):Observable<BodegaWebV[]>{
    return this.http.get<BodegaWebV[]>(`${this.url}/bodegawebv/${usuario}/${empresa}/bodegas`)
  }

}
