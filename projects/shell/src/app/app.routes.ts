import {Routes} from '@angular/router';
import {LayoutComponent} from './layout/components/layout/layout.component';
import {loadRemoteModule} from '@angular-architects/module-federation';
import {authGuard} from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then(m =>
        m.HomeComponent
      ),
  },
  {
    path: 'auth',
    loadChildren: () =>
      loadRemoteModule('mfe-auth', './routes').then(m => m.routes)
  },
  {
    path: 'erp',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'contabilidad',
        loadChildren: () =>
          loadRemoteModule('mfe-auth', './routes').then(m => m.routes)
      }
    ]
  }
];
