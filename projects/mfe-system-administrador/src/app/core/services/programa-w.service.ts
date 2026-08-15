import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import { Observable } from "rxjs";
import {ProgramaW} from '../models/programa-w';

@Injectable({
  providedIn: 'root'
})
export class ProgramaWService {

  private readonly url = `${environment.apiUrl}/assist`
  private http = inject(HttpClient)

  getAll(): Observable<ProgramaW[]> {
    return this.http.get<ProgramaW[]>(`${this.url}/programaw/all`)
  }

  getById(id: number): Observable<ProgramaW> {
    return this.http.get<ProgramaW>(`${this.url}/programaw/${id}`)
  }

  create(menu: ProgramaW): Observable<ProgramaW> {
    return this.http.post<ProgramaW>(`${this.url}/programaw`, menu)
  }

  update(menu: ProgramaW): Observable<ProgramaW> {
    return this.http.put<ProgramaW>(`${this.url}/programaw`, menu)
  }
}
