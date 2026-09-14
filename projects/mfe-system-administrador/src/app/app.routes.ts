import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'menus-sistemas',
    data: {breadcrumb: 'Menus Sistemas', favorite: true},
    title: 'Administracion Sistema Menu | Assist Web',
    loadComponent: () =>
      import('./features/procesos/mantenimientos/menus-sistema/menus-sistema.component').then(m => m.MenusSistemaComponent)
  },
  {
    path: 'accesos',
    data: {breadcrumb: 'Accesos', favorite: true},
    title: 'Administracion Sistema Accesos | Assist Web',
    loadComponent: () =>
      import('./features/procesos/mantenimientos/acceso-rol/acceso-rol.component').then(m => m.AccesoRolComponent)
  }
];
