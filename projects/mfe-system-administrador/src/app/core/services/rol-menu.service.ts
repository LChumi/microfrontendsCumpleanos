import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {RolMenu} from '../models/rol-menu';

@Injectable({
  providedIn: 'root'
})
export class RolMenuService {

  private readonly url =  `${environment.apiUrl}/assist`
  private http = inject(HttpClient)

  getAll(): Observable<RolMenu[]> {
    return this.http.get<RolMenu[]>(`${this.url}/rol-menu/all`)
  }

  getById(id: number): Observable<RolMenu> {
    return this.http.get<RolMenu>(`${this.url}/rol-menu/${id}`)
  }

  create(menu: RolMenu): Observable<RolMenu> {
    return this.http.post<RolMenu>(`${this.url}/rol-menu`, menu)
  }

  update(menu: RolMenu): Observable<RolMenu> {
    return this.http.put<RolMenu>(`${this.url}/rol-menu`, menu)
  }
}
