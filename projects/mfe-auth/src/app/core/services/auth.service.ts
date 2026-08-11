import {inject, Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ServiceResponse} from '../dto/service-response';
import {UserResponse} from '../dto/user-response';
import {AuthenticationRequest} from '../models/autentication-resquest';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private url = environment.apiUrl + '/assist'
  private http = inject(HttpClient)

  temporalLogin(request: AuthenticationRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.url}/auth/login`, request)
  }

  recoveryPassword(userId: string): Observable<ServiceResponse> {
    return this.http.get<ServiceResponse>(`${this.url}/auth/forgot-password/${userId}`)
  }
}
