import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {InfoResponse} from '../models/info-response';
import {ServiceResponse} from '../models/service-response';
import {PaymentResponse} from '../models/payment-response';

@Injectable({
  providedIn: 'root'
})
export class DeunaService {

  private readonly url = `${environment.apiUrl}/pos`
  private http = inject(HttpClient)

  generarPago(usrLiq: number, empresa: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.url}/generar-pago/${usrLiq}/${empresa}`)
  }

  validarPago(usrLiq: number, empresa: number): Observable<InfoResponse> {
    return this.http.get<InfoResponse>(`${this.url}/validar-pago/${usrLiq}/${empresa}`)
  }

  verificarPago(usrLiq: number, empresa: number): Observable<ServiceResponse> {
    return this.http.get<ServiceResponse>(`${this.url}/verificar-pago-existente/${usrLiq}/${empresa}`)
  }
}
