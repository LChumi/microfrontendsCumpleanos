import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Gondola} from '../models/gondola';

@Injectable({
  providedIn: 'root'
})
export class GondolaService {

  private readonly url = `${environment.apiUrl}/pedidos`
  private readonly http = inject(HttpClient)

  getGondolasByUser(empresa: number, user: number): Observable<Gondola[]> {
    return this.http.get<Gondola[]>(`${this.url}/gondolas/list/user/${empresa}/${user}`);
  }

}
