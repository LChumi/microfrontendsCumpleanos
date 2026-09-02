import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ProductoReposicionDto} from '../dto/producto-reposicion.dto';
import {EmpresaCodigosRequest} from '../dto/empresa-codigos-request';

@Injectable({
  providedIn: 'root'
})
export class DreposicionService {

  private readonly url = `${environment.apiUrl}/pedidos`
  private readonly http = inject(HttpClient)

  getProductsByCreposicion(creposicion: any): Observable<ProductoReposicionDto[]>{
    return this.http.get<ProductoReposicionDto[]>(`${this.url}/dreposicion/productos-reposicion/${creposicion}`)
  }

  getProductsByUsrLiquida(usrLiquida: any): Observable<ProductoReposicionDto[]>{
    return this.http.get<ProductoReposicionDto[]>(`${this.url}/dreposicion/productos-reposicion/${usrLiquida}/liquida`)
  }

  generateUsrLiquida(request: EmpresaCodigosRequest): Observable<number>{
    return this.http.post<number>(`${this.url}/dreposicion/productos-reposicion/usrliquida`, request)
  }

  deleteProductoReposicion(codigo , empresa): Observable<void>{
    return this.http.delete<void>(`${this.url}/dreposicion/productos-reposicion/${codigo}/${empresa}`)
  }

}
