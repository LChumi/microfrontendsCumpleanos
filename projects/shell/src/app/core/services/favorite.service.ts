import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {FavoriteRequest} from '../models/favorite.request';
import {UsuarioFavoritos} from '../models/usuario-favoritos';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {

  private readonly url = `${environment.apiUrl}/assist`
  private http = inject(HttpClient)

  getFavorites(usrId: number, empresa: number): Observable<UsuarioFavoritos[]> {
    return this.http.get<UsuarioFavoritos[]>(`${this.url}/favoritos/${usrId}/${empresa}`)
  }

  addFavorite(request: FavoriteRequest): Observable<UsuarioFavoritos> {
    return this.http.post<UsuarioFavoritos>(`${this.url}/favoritos/add`, request)
  }

  isFavorited(request: FavoriteRequest): Observable<boolean> {
    return this.http.post<boolean>(`${this.url}/favoritos/get`, request)
  }

  deleteFavorite(request: FavoriteRequest) {
    return this.http.delete(`${this.url}/favoritos/delete`, {body: request})
  }
}
