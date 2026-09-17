import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from './models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8081/system/auth';

  // SOLO memoria. No localStorage ni sessionStorage.
  private accessToken: string | null = null;

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.baseUrl}/login`,
      request,
      { withCredentials: true }
    ).pipe(
      tap(response => {
        this.accessToken = response.accessToken;
      })
    );
  }

  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.baseUrl}/refresh`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(response => {
        this.accessToken = response.accessToken;
      })
    );
  }

  logout(): void {
    this.accessToken = null;

    this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .subscribe({ error: () => { /* token local ya limpio, ignoramos fallo del server */ } });
  }

  clearToken(): void {
    this.accessToken = null;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }
}
