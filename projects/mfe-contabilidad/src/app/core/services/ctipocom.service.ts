import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {CtipocomDto} from '../dto/ctipocom.dto';

@Injectable({
  providedIn: 'root'
})
export class CtipocomService {

  private readonly url = environment.apiUrl + '/models'
  private http = inject(HttpClient)

  listar(empresa: any): Observable<CtipocomDto[]> {
    return this.http.get<CtipocomDto[]>(`${this.url}/ctipocom/listar/${empresa}`)
  }
}
