import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {UsrDto} from '../dto/usr.dto';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UsrBodService {

  private url = `${environment.apiUrl}/models`
  private http = inject(HttpClient)

  listBodegas(usrId: number, empresa: number): Observable<UsrDto[]> {
    return this.http.get<UsrDto[]>(`${this.url}/usrbod/bodegas/${usrId}/${empresa}`, {})
  }
}
