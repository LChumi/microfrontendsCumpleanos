import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
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

  generarPrepedido(request: PrePedidoRequestDto): Observable<ReposicionGenerado>{
    return this.http.post<ReposicionGenerado>(`${this.url}/creposicion/generar/prepedido`, request)
  }

  anularPedidos(dto: EmpresaCodigosRequest):Observable<ServiceResponse>{
    return this.http.post<ServiceResponse>(`${this.url}/creposicion/anular/prepedido`, dto)
  }
}
