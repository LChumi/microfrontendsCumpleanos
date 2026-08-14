import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'procesos',
    data: {breadcrumb: 'Procesos'},
    children : [
      {
        path: 'carga-solicitud',
        loadComponent: () =>
          import('./features/procesos/carga-solicitud/carga-solicitud.component').then(m => m.CargaSolicitudComponent),
        title:'Solicitud Importacion | Assist Web',
        data: {breadcrumb: 'Carga solicitud', favorite: true},
      },
      {
        path: 'carga-orden-compra',
        loadComponent: () =>
          import('./features/procesos/carga-orden-compra/carga-orden-compra.component').then(m => m.CargaOrdenCompraComponent),
        data: { breadcrumb: 'Carga Orden de compra', favorite: true},
        title: 'Orden de compra | Assist Web',
      },
      {
        path: 'carga-importacion',
        loadComponent: () =>
          import('./features/procesos/carga-importacion/carga-importacion.component').then(m => m.CargaImportacionComponent),
        title: 'Orden de Importacion | Assist Web',
        data: { breadcrumb: 'Carga Importacion', favorite: true},
      }
    ]
  },
  {
    path: 'consultas',
    data: {breadcrumb: 'Consultas'},
    children: [
      {
        path: 'documentos',
        loadComponent: () =>
          import('./features/consultas/consulta-importacion/consulta-importacion.component').then(m => m.ConsultaImportacionComponent),
        title: 'Consultas Importacion | Assist Web',
        data: {breadcrumb: 'Importaciones', favorite: true},
      }
    ]
  },
];
