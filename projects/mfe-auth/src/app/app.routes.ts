import { Routes } from '@angular/router';
import {LoginComponent} from './features/login/login.component';
import {ForgotComponent} from './features/forgot/forgot.component';
import {EmpresasComponent} from './features/empresas/empresas.component';

export const routes: Routes = [
  {path: 'login', component:LoginComponent},
  {path: 'forgotpassword', component: ForgotComponent},
  {path: 'empresas', component: EmpresasComponent},
  {path: '', redirectTo: 'login', pathMatch: 'full'}
];
