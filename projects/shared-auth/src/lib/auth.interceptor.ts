import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {catchError, finalize, map, Observable, shareReplay, switchMap, throwError} from 'rxjs';
import {AuthService} from './auth.service';

const AUTH_EXCLUDED_PATHS = [
  '/system/auth/login',
  '/system/auth/refresh',
  '/system/auth/logout'
];

let refreshInProgress$: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const isAuthEndpoint = AUTH_EXCLUDED_PATHS.some(path => req.url.includes(path));
  if (isAuthEndpoint) {
    return next(req.clone({withCredentials: true}));
  }

  const accessToken = authService.getAccessToken();
  const authReq = accessToken
    ? req.clone({setHeaders: {Authorization: `Bearer ${accessToken}`}})
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (!refreshInProgress$) {
        refreshInProgress$ = authService.refreshToken().pipe(
          map(res => res.accessToken),
          shareReplay(1),
          finalize(() => {
            refreshInProgress$ = null;
          })
        );
      }

      return refreshInProgress$.pipe(
        switchMap(newToken => {
          const retryReq = req.clone({
            setHeaders: {Authorization: `Bearer ${newToken}`}
          });
          return next(retryReq);
        }),
        catchError(refreshError => {
          authService.clearToken();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
