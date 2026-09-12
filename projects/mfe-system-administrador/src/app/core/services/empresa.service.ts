import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Sistema} from '../models/sistema';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  private readonly url = `${environment.apiUrl}/system`
  private http = inject(HttpClient)

  listEmpresas(): Observable<Sistema[]>{
    return this.http.get<Sistema[]>(`${this.url}/empresas/list`)
  }
}
