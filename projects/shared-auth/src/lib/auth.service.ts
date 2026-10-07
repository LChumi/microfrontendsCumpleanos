import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, map, Observable, of, tap} from 'rxjs';
import {LoginRequest, LoginResponse} from './models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://apis.cumpleanos.com.ec/system/auth';

  // SOLO memoria. No localStorage ni sessionStorage.
  private accessToken: string | null = null;

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.baseUrl}/login`,
      request,
      {withCredentials: true}
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
      {withCredentials: true}
    ).pipe(
      tap(response => {
        this.accessToken = response.accessToken;
      })
    );
  }

  /**
   * Se ejecuta al arrancar la app (F5, pestaña nueva).
   * Si la cookie del refresh token sigue vigente, recupera el access token
   * sin pedir login. Nunca lanza error: devuelve true/false.
   */
  restoreSession(): Observable<boolean> {
    return this.refreshToken().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  logout(): void {
    this.accessToken = null;

    this.http.post(`${this.baseUrl}/logout`, {}, {withCredentials: true})
      .subscribe({
        error: () => { /* token local ya limpio, ignoramos fallo del server */
        }
      });
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
