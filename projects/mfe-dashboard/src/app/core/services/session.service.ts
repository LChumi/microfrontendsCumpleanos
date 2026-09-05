import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {SessionAccessDTO} from '../models/session-access.dto';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private readonly url = `${environment.apiUrl}/mongo`
  private readonly http = inject(HttpClient)

  getUserAccesses(userId: any):Observable<SessionAccessDTO[]>{
    return this.http.get<SessionAccessDTO[]>(`${this.url}/session/user/${userId}`)
  }
}
