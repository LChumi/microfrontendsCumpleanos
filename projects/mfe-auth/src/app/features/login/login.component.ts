import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {UserService} from '../../core/services/user.service';
import {NgClass, NgOptimizedImage} from '@angular/common';
import {getSessionItem, setSessionItem} from '../../core/utils/storage.utils';
import {NotificationService} from 'shared-notifications';
import Clarity from '@microsoft/clarity'
import {UserResponse} from '../../core/dto/user-response';
import {AuthService, LoginRequest} from 'shared-auth';
import {HttpErrorResponse} from '@angular/common/http';
import {ErrorResponse} from '../../core/error/error-response';
import {notBlank} from '../../core/utils/not-blank.validator';
import {finalize} from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NgOptimizedImage,
    NgClass
  ],
  templateUrl: './login.component.html',
  styles: ``
})
export class LoginComponent implements OnInit {

  readonly date = new Date().getFullYear();

  password!: string;
  loginForm!: FormGroup
  mostrarPassword = false;
  loading = false;

  private fb = inject(FormBuilder)
  private readonly authService = inject(AuthService)
  private usuarioService = inject(UserService)
  private router = inject(Router)
  private notif = inject(NotificationService)

  ngOnInit(): void {
    this.getSession()
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required, notBlank]],
      password: ['', Validators.required]
    })
  }

  invalid(name: string): boolean {
    const c = this.loginForm.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();   // muestra los errores al enviar
      return;
    }

    const loginRequest: LoginRequest = {
      usrId: this.loginForm.get('usuario')!.value.trim(),
      password: this.loginForm.get('password')!.value
    };

    this.loading = true;
    this.authService.login(loginRequest)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
      next: () => {
        this.getDatosUser(loginRequest.usrId)
      },
      error: (err: HttpErrorResponse) => {
        const apiError = err.error as ErrorResponse;
        const detail =
          err.status === 0 ? 'No hay conexión con el servidor'
            : apiError?.message ?? 'Error inesperado, intente nuevamente';

        this.notif.showToast({
          type: 'warning',
          summary: err.status === 401 ? 'Credenciales incorrectas' : 'No se pudo iniciar sesión',
          detail,
          autoCloseMs: 2500
        });
      }
    })
  }

  getDatosUser(usrId: string) {
    this.usuarioService.me(usrId).subscribe({
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
      },
      error: () => {
        this.notif.showToast({
          type: 'warning',
          summary: 'Error al cargar usuario',
          detail: 'No se pudo completar el inicio de sesión',
          autoCloseMs: 2000
        });
      }
    })
  }

  goToEmpresas() {
    this.router.navigate(['/auth', 'empresas']).then(() => {
    })
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

  private notifyClarity(user: UserResponse) {
    Clarity.identify(
      user.id.toString(),              // customId
      undefined,                       // customSessionId
      'AssistWeb',                       // customPageId
      `${user.nombre} (${user.username})` // friendlyName
    );
    Clarity.setTag("username", user.username);
    Clarity.setTag("nombre", user.nombre);
    Clarity.event(user.username)
  }
}
