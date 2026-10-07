import {CanActivateChildFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from 'shared-auth';
import {getSessionItem} from '../core/utils/storage-utils';

export const authFlowGuard: CanActivateChildFn = (childRoute, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const hasUser =
    !!getSessionItem('usrId') &&
    !!getSessionItem('nombre') &&
    !!getSessionItem('username');

  const hasEmpresa = !!getSessionItem('empresa');
  const  isAuthed = auth.isAuthenticated() && hasUser;

  const url = state.url.split('?')[0];

  if (url.startsWith('/auth/empresas')){
    return isAuthed ? true : router.createUrlTree(['/auth', 'login']);
  }

  if (url.startsWith('/auth/login')){
    if (!isAuthed) return true;
    return hasEmpresa
    ? router.createUrlTree(['/erp', 'dashboard'])
    : router.createUrlTree(['/auth', 'empresas']);
  }

  return true;
};
