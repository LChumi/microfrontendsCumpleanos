import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'pedido-despachos',
    data: {breadcrumb: 'Pedido de despachos', favorite: true},
    title: 'Gestion pedidos Despachos | Assist Web',
    loadComponent: () =>
      import('./features/procesos/pedidos/despacho/despacho.component').then(m => m.DespachoComponent)
  }
];
