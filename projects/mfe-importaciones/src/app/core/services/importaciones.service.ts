import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Items} from '../dto/items';
import {SolicitudRequestDTO} from '../dto/solicitud-request.dto';
import {SciResponse} from '../dto/sci-response';
import {OrdenCompraListDTO} from '../dto/orden-compra-list.dto';

@Injectable({
  providedIn: 'root'
})
export class ImportacionesService {

  private url = `${environment.apiUrl}/assist`
  private http = inject(HttpClient)

  sendExcel(file: File, empresa: string): Observable<Items[]> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('empresa', empresa);

    return this.http.post<Items[]>(`${this.url}/importaciones/excel/solicitud`, formData)
  }

  confirmarSolicitud(request: SolicitudRequestDTO): Observable<SciResponse> {
    return this.http.post<SciResponse>(`${this.url}/importaciones/confirmar/solicitud`, request);
  }

  sendOrder(file: File, empresa: string, cco: any): Observable<OrdenCompraListDTO> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('empresa', empresa);
    formData.append('cco', cco)

    return this.http.post<OrdenCompraListDTO>(`${this.url}/importaciones/excel/orden_compra`, formData)
  }

  confirmarOrden(request: SolicitudRequestDTO): Observable<SciResponse> {
    return this.http.post<SciResponse>(`${this.url}/importaciones/confirmar/orden`, request);
  }

}
