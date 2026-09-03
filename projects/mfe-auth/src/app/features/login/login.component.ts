import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {MessageService} from 'primeng/api';
import {ErrorResponse} from '../../core/error/error-response';
import {AuthService} from '../../core/services/auth.service';
import {AuthenticationRequest} from '../../core/models/autentication-resquest';
import {CheckboxModule} from 'primeng/checkbox';
import {InputTextModule} from 'primeng/inputtext';
import {NgOptimizedImage} from '@angular/common';
import {getSessionItem, setSessionItem} from '../../core/utils/storage.utils';
import {NotificationService} from 'shared-notifications';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CheckboxModule,
    RouterLink,
    InputTextModule,
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

  private fb = inject(FormBuilder)
  private usuarioService = inject(AuthService)
  private router = inject(Router)
  private messageService = inject(MessageService)
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

        this.messageService.add({severity: 'success', summary: 'Bienvenido', detail: user.nombre, life: 2000})
        this.notif.showToast({
          type: 'success',
          summary: 'Bienvenido',
          detail: user.nombre,
          autoCloseMs: 10000
        })
        this.goToEmpresas()
      }, error: (error: ErrorResponse) => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Verifique nombre usuario o contraseña',
          detail: error.message
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
        this.messageService.add({severity: 'success', summary: 'Bienvenido', detail: 'Sesión iniciada', life: 2000})
        this.goToEmpresas()
      }
    }, 500)
  }
}
