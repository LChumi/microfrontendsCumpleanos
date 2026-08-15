import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'menus-sistemas',
    data: {breadcrumb: 'Menus Sistemas', favorite: true},
    title: 'Administracion Sistema Menu | Assist Web',
    loadComponent: () =>
      import('./features/procesos/mantenimients/menus-sistema/menus-sistema.component').then(m => m.MenusSistemaComponent)
  }
];
