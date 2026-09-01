import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {FacDespedidowebV} from '../dto/fac-despedidoweb-v';
import {FacDesprodWebV} from '../dto/fac-desprod-web-v';
import {ServiceResponse} from '../dto/service-response';

@Injectable({
  providedIn: 'root'
})
export class GestionPedidosService {

  private url = `${environment.apiUrl}/pedidos`
  private http = inject(HttpClient)

  getPendientes(usuario:string, estado:number):Observable<FacDespedidowebV[]> {
    return this.http.get<FacDespedidowebV[]>(`${this.url}/pendientes/${usuario}/${estado}`)
  }

  getProductos(empresa: number, cco: any, hoja?: number): Observable<FacDesprodWebV[]> {
    let url = `${this.url}/despacho/productos/${empresa}/${cco}`;
    if (hoja) {
      url += `?hoja=${hoja}`;
    }
    return this.http.get<FacDesprodWebV[]>(url);
  }

  addCantidad(producto:FacDesprodWebV):Observable<ServiceResponse>{
    return this.http.post<ServiceResponse>(`${this.url}/despacho/add-cantidad`, producto)
  }
}
