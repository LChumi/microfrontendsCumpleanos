import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../../environments/environment"
import {MenuPrincipal} from '../models/menu-principal';

@Injectable({
  providedIn: 'root'
})
export class MenusService {

  private baseUrl = environment.apiUrl + '/assist'
  private http = inject(HttpClient)

  getMenus(usuario: number, empresa: number): Observable<MenuPrincipal[]> {
    return this.http.get<MenuPrincipal[]>(`${this.baseUrl}/acceso-rol/menus/${usuario}/${empresa}`)
  }

}
