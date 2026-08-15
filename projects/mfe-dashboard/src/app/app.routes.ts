import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path:'inicio',
    data: {breadcrumb: 'Inicio Dashboard'},
    title: 'Dashboard | Assist web',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  },
  {path: '**', redirectTo: 'dashboard', pathMatch: "full"}
];
