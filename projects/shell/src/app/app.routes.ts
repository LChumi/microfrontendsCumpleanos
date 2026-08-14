import {Routes} from '@angular/router';
import {LayoutComponent} from './layout/components/layout/layout.component';
import {authGuard} from './guards/auth.guard';
import {loadRemoteModuleSafe} from './core/utils/load-remote-module-safe';

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
      loadRemoteModuleSafe('mfe-auth', './routes').then(m => m.routes)
  },
  {
    path: 'erp',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          loadRemoteModuleSafe('mfe-dashboard', './routes').then(m => m.routes)
      },
      {
        path: 'contabilidad',
        data: {breadcrumb: 'Contabilidad'},
        loadChildren: () =>
          loadRemoteModuleSafe('mfe-contabilidad', './routes').then(m => m.routes)
      }
    ]
  },
  {path: '**', redirectTo: 'auth', pathMatch: "full"}
];
