import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ServiceResponse} from '../dto/service-response';
import {UserResponse} from '../dto/user-response';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private url = environment.apiUrl + '/assist'
  private http = inject(HttpClient)

  me(usrId: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.url}/auth/me/${usrId}`)
  }

  recoveryPassword(userId: string): Observable<ServiceResponse> {
    return this.http.get<ServiceResponse>(`${this.url}/auth/forgot-password/${userId}`)
  }
}
