import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'procesos',
    data: {breadcrumb: 'Procesos'},
    children: [
      {
        path: 'aprobar-pedido',
        data: {breadcrumb: 'Aprobar Pedido', favorite: true},
        title: 'Pedidos por Aprobar | Assist Web',
        loadComponent: () =>
          import('./features/procesos/reposicion/aprobar-reposicion/aprobar-reposicion.component').then(m => m.AprobarReposicionComponent)
      },
      {
        path: 'aprobacion/:usrLiquida/:bodega/:almacen',
        data: {breadcrumb: 'Productos por aprobar'},
        title: 'Productos por aprobar | Assist Web',
        loadComponent: () =>
          import('./features/procesos/reposicion/components/dreposicion-aprobacion/dreposicion-aprobacion.component').then(m => m.DreposicionAprobacionComponent)
      },
      {
        path: 'despachos',
        data: {breadcrumb: 'Despachos', favorite: true},
        title: 'Pedidos por Despachar | Assist Web',
        loadComponent: () =>
          import('./features/procesos/pedidos/despacho/despacho.component').then(m => m.DespachoComponent)
      },
      {
        path: 'reposicion',
        data: {breadcrumb: 'Generar Reposición'},
        children: [
          {
            path: 'nuevo-pedido',
            data: {breadcrumb: 'Nuevo Pedido', favorite: true},
            title: 'Nueva Reposicion',
            loadComponent: () =>
              import('./features/procesos/reposicion/generar-reposicion/generar-reposicion.component').then(m => m.GenerarReposicionComponent)
          },
          {
            path: 'pedido/:id',
            data: {breadcrumb: 'Pedido Generado'},
            title: 'Pedido Generado',
            loadComponent: () =>
              import('./features/procesos/reposicion/pedido-detalle/pedido-detalle.component').then(m => m.PedidoDetalleComponent)
          }
        ]
      }
    ]
  }
];
