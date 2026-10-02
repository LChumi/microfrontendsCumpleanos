import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ProductoReposicionDto} from '../dto/producto-reposicion.dto';
import {EmpresaCodigosRequest} from '../dto/empresa-codigos-request';
import {ProductoReposicionUpdateDto} from '../dto/producto-reposicion-update.dto';
import {ServiceResponse} from '../dto/service-response';
import {Dreposicion} from '../models/dreposicion';

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

  deleteProductoReposicion(codigo: any , empresa: any): Observable<void>{
    return this.http.delete<void>(`${this.url}/dreposicion/productos-reposicion/${codigo}/${empresa}`)
  }

  updateProdcut(request: ProductoReposicionUpdateDto): Observable<ServiceResponse>{
    return this.http.put<ServiceResponse>(`${this.url}/dreposicion/productos-reposicion`, request)
  }

  addedProduct(prod: Dreposicion): Observable<Dreposicion>{
    return this.http.post<Dreposicion>(`${this.url}/dreposicion/productos-reposicion`, prod)
  }

  getProduct(bodega:number, data:string): Observable<ProductoReposicionDto[]>{
    const params = new HttpParams().set('data', data)
    return this.http.get<ProductoReposicionDto[]>(`${this.url}/dreposicion/buscar-productos/${bodega}`, {params})
  }

}
