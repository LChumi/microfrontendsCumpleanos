import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Empleado} from '../models/empleado';
import {ServiceResponse} from '../dto/service-response.dto';

@Injectable({
  providedIn: 'root'
})
export class ContabilidadService {

  private readonly url = environment.apiUrl;
  private http = inject(HttpClient)

  getEmpleado(usuarioId: string): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.url}/models/empleado/id-usuario/${usuarioId}`)
  }

  sendString(data: string, email: string): Observable<ServiceResponse> {
    const params = new HttpParams().set('email', email);
    return this.http.post<ServiceResponse>(`${this.url}/recp/string`, data, {params})
  }

  sendFile(file: File, email: string): Observable<ServiceResponse> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('email', email);
    return this.http.post<ServiceResponse>(`${this.url}/recp/file`, formData)
  }
}
