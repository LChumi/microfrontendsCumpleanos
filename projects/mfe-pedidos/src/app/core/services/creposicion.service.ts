import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {PrePedidoRequestDto} from '../dto/prepedido-request.dto';
import {ReposicionGenerado} from '../dto/reposicion-generado';
import {Creposicion} from '../models/creposicion';
import {ServiceResponse} from '../dto/service-response';
import {EmpresaCodigosRequest} from '../dto/empresa-codigos-request';

@Injectable({
  providedIn: 'root'
})
export class CreposicionService {

  private readonly url = `${environment.apiUrl}/pedidos`
  private readonly http = inject(HttpClient)

  listarPedidos(estado: number, bodega: number, tipo: number): Observable<Creposicion[]> {
    return this.http.get<Creposicion[]>(`${this.url}/creposicion/load-finalizados/${estado}/${bodega}/${tipo}`)
  }

  listarPendientes(tipo: number, usr:string):Observable<Creposicion[]>{
    const params = new HttpParams().set('usuarioId', usr)
    return this.http.get<Creposicion[]>(`${this.url}/creposicion/load-pendientes/${tipo}`, {params})
  }

  generarPrepedido(request: PrePedidoRequestDto): Observable<ReposicionGenerado>{
    return this.http.post<ReposicionGenerado>(`${this.url}/creposicion/generar/prepedido`, request)
  }

  anularPedidos(dto: EmpresaCodigosRequest):Observable<ServiceResponse>{
    return this.http.post<ServiceResponse>(`${this.url}/creposicion/anular/prepedido`, dto)
  }

  generarReposicion(crepo: Creposicion): Observable<Creposicion>{
    return this.http.post<Creposicion>(`${this.url}/creposicion/generar/reposicion`, crepo)
  }
}
