import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {UsuarioDTO} from '../dto/usuario.dto';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private readonly url = `${environment.apiUrl}/system`
  private http = inject(HttpClient)

  buscar(usrId: string): Observable<UsuarioDTO[]> {
    return this.http.get<UsuarioDTO[]>(`${this.url}/usuarios/buscar`, {
      params: { usrId }
    });
  }

}
