import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {PrePedidoRequestDto} from '../dto/prepedido-request.dto';
import {ReposicionGenerado} from '../dto/reposicion-generado';
import {Creposicion} from '../models/creposicion';

@Injectable({
  providedIn: 'root'
})
export class CreposicionService {

  private readonly url = `${environment.apiUrl}/pedidos`
  private readonly http = inject(HttpClient)

  listarPedidos(estado: number, bodega: number, tipo: number): Observable<Creposicion[]> {
    return this.http.get<Creposicion[]>(`${this.url}/creposicion/load-finalizados/${estado}/${bodega}/${tipo}`)
  }

  generarPrepedido(request: PrePedidoRequestDto): Observable<ReposicionGenerado>{
    return this.http.post<ReposicionGenerado>(`${this.url}/creposicion/generar/prepedido`, request)
  }
}
