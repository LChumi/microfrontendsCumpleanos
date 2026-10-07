import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {getSessionItem} from '../core/utils/storage-utils';
import {AuthService} from 'shared-auth';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router)
  const auth = inject(AuthService)

  const usrLogged = getSessionItem('usrId');
  const empresa = getSessionItem('empresa');
  const nombre = getSessionItem('nombre');
  const username = getSessionItem('username');

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth', 'login']);
  }

  // Usuario autenticado y empresa seleccionada
  if (usrLogged && empresa && nombre && username) {
    return true;
  }

  // Usuario autenticado pero falta seleccionar empresa
  if (usrLogged && !empresa && nombre && username) {
    return router.createUrlTree(['/auth', 'empresas']);
  }

  // Cualquier otro caso -> Login
  return router.createUrlTree(['/auth', 'login']);
};
