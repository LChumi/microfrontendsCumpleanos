import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'procesos',
    data: {breadcrumb: 'Procesos'},
    children: [
      {
        path:'carga-documentos',
        loadComponent: () =>
          import('./features/procesos/carga-doc-sri/carga-doc-sri.component').then(m => m.CargaDocSriComponent),
        title: 'Pagina de procesos carga documentos | Assist web',
        data: {breadcrumb: 'Carga documentos', favorite: true}
      }
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
        data: {breadcrumb: 'Monitoreo', favorite: true}
      }
    ]
  }
];
