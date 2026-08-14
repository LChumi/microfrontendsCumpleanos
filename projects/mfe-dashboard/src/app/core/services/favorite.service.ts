import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {UsuarioFavorito} from '../models/usuario-favorito';
import {FavoriteRequest} from '../dto/favorite-request';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {

  private readonly url = `${environment.apiUrl}/assist`
  private http = inject(HttpClient)

  getFavorites(usrId: number, empresa: number): Observable<UsuarioFavorito[]> {
    return this.http.get<UsuarioFavorito[]>(`${this.url}/favoritos/${usrId}/${empresa}`)
  }

  addFavorite(request: FavoriteRequest): Observable<UsuarioFavorito> {
    return this.http.post<UsuarioFavorito>(`${this.url}/favoritos/add`, request)
  }

  isFavorited(request: FavoriteRequest): Observable<boolean> {
    return this.http.post<boolean>(`${this.url}/favoritos/get`, request)
  }

  deleteFavorite(request: FavoriteRequest) {
    return this.http.delete(`${this.url}/favoritos/delete`, {body: request})
  }
}
