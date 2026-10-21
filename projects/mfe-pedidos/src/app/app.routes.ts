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
      },
      {
        path: 'transferencia',
        data: {breadcrumb: 'Solicitud de Transferencia'},
        children:[
          {
            path: 'nueva-solicitud',
            data: {breadcrumb: 'Nuevo Solicitud', favorite: true},
            title: 'Nueva Solicitud de Transferencia',
            loadComponent: () =>
              import('./features/procesos/reposicion/solicitud-transferencia/solicitud-transferencia.component').then(m => m.SolicitudTransferenciaComponent)
          },
          {
            path: 'solicitud/:id',
            data: {breadcrumb: 'Solicitud-transferencia'},
            title: 'Solicitud Transferencia | Assist Web',
            loadComponent: () =>
              import('./features/procesos/reposicion/solicitud-detalle/solicitud-detalle.component').then(m => m.SolicitudDetalleComponent)
          }
        ]
      }
    ]
  },
  {
    path: 'comercial',
    data: {breadcrumb: 'Comercial'},
    children: [
      {
        path: 'pedido-clientes',
        data: {breadcrumb: 'Pedidos'},
        title: 'Pedidos | Assist Web',
        loadComponent: () =>
          import('./features/procesos/comercial/pedido-clientes/pedido-clientes.component').then(m => m.PedidoClientesComponent)
      },
      {
        path: 'mapas-vendedores',
        data: {breadcrumb: 'Mapas de Vendedores'},
        title: 'Mapas de Vendedores | Assist Web',
        loadComponent: () =>
          import('./features/procesos/comercial/mapa-puntos-venta/mapa-puntos-venta.component').then(m => m.MapaPuntosVentaComponent)
      }
    ]
  }
];
