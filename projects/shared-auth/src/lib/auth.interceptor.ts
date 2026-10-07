import {HttpErrorResponse, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {catchError, finalize, map, Observable, shareReplay, switchMap, throwError} from 'rxjs';
import {AuthService} from './auth.service';
import {Router} from '@angular/router';

// Endpoints que NO deben llevar Bearer ni disparar refresh
const AUTH_EXCLUDED_PATHS = ['/login', '/refresh', '/logout'];

// Refresh compartido entre todas las peticiones concurrentes (misma pestaña)
let refresh$: Observable<string> | null = null;

const addToken = (req: HttpRequest<unknown>, token: string) =>
  req.clone({setHeaders: {Authorization: `Bearer ${token}`}});

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint = AUTH_EXCLUDED_PATHS.some(path => req.url.includes(path));
  if (isAuthEndpoint) {
    return next(req.clone({withCredentials: true}));
  }

  const sentToken = authService.getAccessToken();
  const authReq = sentToken ? addToken(req, sentToken) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // Otro request ya refrescó mientras este estaba en vuelo: solo reintentar
      const current = authService.getAccessToken();
      if (current && current !== sentToken) {
        return next(addToken(req, current));
      }

      if (!refresh$) {
        refresh$ = authService.refreshToken().pipe(
          map(res => res.accessToken),
          catchError(err => {
            // Cerrar sesión SOLO si el servidor rechaza el refresh token
            if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
              authService.clearToken();
              router.navigate(['/login']);
            }
            return throwError(() => err);
          }),
          finalize(() => {
            refresh$ = null;
          }),
          shareReplay({bufferSize: 1, refCount: false})
        );
      }

      // Los errores del reintento pasan tal cual, sin cerrar sesión
      return refresh$.pipe(
        switchMap(token => next(addToken(req, token)))
      );
    })
  );
};
