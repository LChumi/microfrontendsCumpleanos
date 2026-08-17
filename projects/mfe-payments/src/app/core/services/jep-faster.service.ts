import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ServiceResponse} from '../models/service-response';
import {JepResponse} from '../models/jep-response';

@Injectable({
  providedIn: 'root'
})
export class JepFasterService {

  private readonly url = `${environment.apiUrl}/pos`
  private http = inject(HttpClient)

  generarQr(usrLiq: number, empresa: number):Observable<JepResponse>{
    return this.http.get<JepResponse>(`${this.url}/jep-faster/qr/${usrLiq}/${empresa}`)
  }

  validarPago(usrLiq: number, empresa: number):Observable<ServiceResponse>{
    return this.http.get<ServiceResponse>(`${this.url}/jep-faster/validar-pago/${usrLiq}/${empresa}`)
  }

  verificarPago(usrLiq: number, empresa: number):Observable<ServiceResponse>{
    return this.http.get<ServiceResponse>(`${this.url}/jep-faster/verificar-pago/${usrLiq}/${empresa}`)
  }
}
