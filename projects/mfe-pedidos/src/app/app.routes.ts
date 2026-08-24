import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'procesos',
    data: {breadcrumb: 'Procesos'},
    children: [
      {
        path: 'despachos',
        data: {breadcrumb: 'Despachos', favorite: true},
        title: 'Pedidos por Despachar | Assist Web',
        loadComponent: () =>
          import('./features/procesos/pedidos/despacho/despacho.component').then(m => m.DespachoComponent)
      }
    ]
  }
];
