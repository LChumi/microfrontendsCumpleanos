import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {PedidoHojaId} from '../models/pedido-hoja-id';
import {Observable} from 'rxjs';
import {ServiceResponse} from '../dto/service-response';

@Injectable({
  providedIn: 'root'
})
export class PedidoHojaService {

  private url = `${environment.apiUrl}/models`
  private http = inject(HttpClient)

  updateHojaEstado(id:PedidoHojaId, estado:number): Observable<ServiceResponse>{
    return this.http.put<ServiceResponse>(`${this.url}/pedido-hoja/${estado}`, id)
  }
}
