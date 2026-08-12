import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {CompraDetalleProductoDto} from '../dto/compra-detalle-producto.dto';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ComprobanteDetalleService {

  private readonly url = `${environment.apiUrl}/models`
  private http = inject(HttpClient)

  verSci(cco: any): Observable<CompraDetalleProductoDto>{
    return this.http.get<CompraDetalleProductoDto>(`${this.url}/comprobante-detalle/${cco}/productos`)
  }
}
