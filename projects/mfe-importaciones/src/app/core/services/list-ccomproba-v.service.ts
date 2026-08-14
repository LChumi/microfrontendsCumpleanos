import {inject, Injectable} from '@angular/core';
import {environment} from '../../../../../mfe-contabilidad/src/environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ListCcomprobaVDto} from '../../../../../mfe-contabilidad/src/app/core/dto/list-ccomproba-v.dto';

@Injectable({
  providedIn: 'root'
})
export class ListCcomprobaVService {

  private url =`${environment.apiUrl}/assist`
  private http = inject(HttpClient)

  buscar(
    empresa?: number,
    periodo?: number,
    fecha?: string,
    mes?: number,
    sigla?: number,
    almacen?: number,
    serie?: number,
    numero?: number,
    concepto?: string,
    referencia?: string,
    estado?: number,
    tipodoc?: number,
  ): Observable<ListCcomprobaVDto[]> {
    let params = new HttpParams();
    if (empresa) params = params.set('empresa', empresa);
    if (periodo) params = params.set('periodo', periodo);
    if (fecha) params = params.set('fecha', fecha); // Formato YYYY-MM-DD
    if (mes) params = params.set('mes', mes);
    if (sigla) params = params.set('sigla', sigla);
    if (almacen) params = params.set('almacen', almacen);
    if (serie) params = params.set('serie', serie);
    if (numero) params = params.set('numero', numero);
    if (concepto) params = params.set('concepto', concepto);
    if (referencia) params = params.set('referencia', referencia);
    if (estado) params = params.set('estado', estado);
    if (tipodoc) params = params.set('tipodoc', tipodoc);
    return this.http.get<ListCcomprobaVDto[]>(`${this.url}/list-ccomprobav/buscar`, { params });
  }
}
