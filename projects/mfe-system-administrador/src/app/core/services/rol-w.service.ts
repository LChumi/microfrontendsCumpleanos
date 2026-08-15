import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {RolW} from '../models/rol-w';

@Injectable({
  providedIn: 'root'
})
export class RolWService {

  private readonly url = `${environment.apiUrl}/assist`
  private http= inject(HttpClient)

  getAll(): Observable<RolW[]> {
    return this.http.get<RolW[]>(`${this.url}/rolw/all`)
  }

  getById(id: number): Observable<RolW> {
    return this.http.get<RolW>(`${this.url}/rolw/${id}`)
  }

  create(menu: RolW): Observable<RolW> {
    return this.http.post<RolW>(`${this.url}/rolw`, menu)
  }

  update(menu: RolW): Observable<RolW> {
    return this.http.put<RolW>(`${this.url}/rolw`, menu)
  }
}
