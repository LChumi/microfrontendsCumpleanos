import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Seguridad} from '../models/seguridad';

@Injectable({
  providedIn: 'root'
})
export class SeguridadService {

  private readonly url = `${environment.apiUrl}/models`
  private readonly http= inject(HttpClient)

  getAll():Observable<Seguridad[]>{
    return this.http.get<Seguridad[]>(`${this.url}/seguridad/all`)
  }
}
