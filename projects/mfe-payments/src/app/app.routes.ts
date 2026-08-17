import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'deuna/:id/:empresa',
    loadComponent: () =>
    import('./features/deuna/deuna.component').then(m => m.DeunaComponent),
    title: 'Pagos DeUna! | Assist Web'
  },
  {
    path: 'jep-faster/:id/:empresa',
    loadComponent: () =>
      import('./features/jep-faster/jep-faster.component').then(m => m.JepFasterComponent),
    title: 'JEPFaster | Assist Web'
  },
];
