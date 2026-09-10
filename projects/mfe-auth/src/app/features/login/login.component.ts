import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../core/services/auth.service';
import {AuthenticationRequest} from '../../core/models/autentication-resquest';
import {NgOptimizedImage} from '@angular/common';
import {getSessionItem, setSessionItem} from '../../core/utils/storage.utils';
import {NotificationService} from 'shared-notifications';
import Clarity from '@microsoft/clarity'
import {UserResponse} from '../../core/dto/user-response';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NgOptimizedImage
  ],
  templateUrl: './login.component.html',
  styles: ``
})
export class LoginComponent implements OnInit {

  readonly date = new Date().getFullYear();

  password!: string;
  loginForm!: FormGroup
  mostrarPassword = false;

  private fb = inject(FormBuilder)
  private usuarioService = inject(AuthService)
  private router = inject(Router)
  private notif = inject(NotificationService)

  ngOnInit(): void {
    this.getSession()
    this.loginForm = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required]
    })
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return
    }
    const usuario = this.loginForm.get('usuario')?.value
    const password = this.loginForm.get('password')?.value

    const loginRequest: AuthenticationRequest = {
      nombreUsuario: usuario,
      clave: password
    }

    this.usuarioService.temporalLogin(loginRequest).subscribe({
      next: user => {
        setSessionItem('usrId', String(user.id))
        setSessionItem('nombre', user.nombre)
        setSessionItem('username', user.username)
        window.dispatchEvent(new CustomEvent('user-logged-in'));
        this.notifyClarity(user)
        this.notif.showToast({
          type: 'success',
          summary: 'Bienvenido',
          detail: user.nombre,
          autoCloseMs: 2000
        })
        this.goToEmpresas()
      }, error: () => {
        this.notif.showToast({
          type: 'warning',
          summary: 'Usuario no autenticado',
          detail: 'Verifique nombre de usuario o contraseña',
          autoCloseMs: 2000
        })
      }
    })
  }

  goToEmpresas() {
    this.router.navigate(['/auth', 'empresas']).then(() => {})
  }

  private getSession() {
    setTimeout(() => {
      const usrId = getSessionItem("usrId")
      if (usrId) {
        this.notif.showToast({
          type: 'success',
          summary: 'Bienvenido',
          detail: 'Sesión iniciada',
          autoCloseMs: 2000
        })
        this.goToEmpresas()
      }
    }, 500)
  }

  private notifyClarity(user: UserResponse){
    Clarity.identify(
      user.id.toString(),              // customId
      undefined,                       // customSessionId
      'AssistWeb',                       // customPageId
      `${user.nombre} (${user.username})` // friendlyName
    );
    Clarity.setTag("username", user.username);
    Clarity.setTag("nombre", user.nombre);
  }
}
