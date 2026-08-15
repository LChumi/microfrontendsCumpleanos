import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {MenuW} from '../models/menu-w';

@Injectable({
  providedIn: 'root'
})
export class MenuWService {

  private readonly url = `${environment.apiUrl}/assist`
  private http = inject(HttpClient)

  getAll(): Observable<MenuW[]> {
    return this.http.get<MenuW[]>(`${this.url}/menuw/all`)
  }

  getById(id: number): Observable<MenuW> {
    return this.http.get<MenuW>(`${this.url}/menuw/${id}`)
  }

  create(menu: MenuW): Observable<MenuW> {
    return this.http.post<MenuW>(`${this.url}/menuw`, menu)
  }

  update(menu: MenuW): Observable<MenuW> {
    return this.http.put<MenuW>(`${this.url}/menuw`, menu)
  }
}
