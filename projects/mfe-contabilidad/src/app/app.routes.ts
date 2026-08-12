import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'procesos',
    data: {breadcrumb: 'Procesos'},
    children: [

    ]
  },
  {
    path: 'consultas',
    data: {breadcrumb: 'Consultas'},
    children: [
      {
        path: 'monitoreo',
        loadComponent: () =>
          import('./features/consultas/monitoreo/monitoreo.component').then(m => m.MonitoreoComponent),
        title: 'Pagina de consultas monitoreo | Assist web',
        data: {breadcrumb: 'Monitoreo'}
      }
    ]
  }
];
