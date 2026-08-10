import { Routes } from '@angular/router';
import {LoginComponent} from './login/login.component';
import {ForgotComponent} from './forgot/forgot.component';
import {EmpresasComponent} from './empresas/empresas.component';

export const routes: Routes = [
  {path: 'login', component:LoginComponent},
  {path: 'forgotpassword', component: ForgotComponent},
  {path: 'empresas', component: EmpresasComponent},
  {path: '', redirectTo: 'login', pathMatch: 'full'}
];
