import {Component, inject, OnInit} from '@angular/core';
import {ServiceResponse} from '../../core/dto/service-response';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from '../../core/services/auth.service';
import {RouterLink} from '@angular/router';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgOptimizedImage
  ],
  templateUrl: './forgot.component.html',
  styles: ``
})
export class ForgotComponent implements OnInit{
  resendForm!: FormGroup

  response = true;
  loading = false;
  serviceResponse: ServiceResponse = {} as ServiceResponse

  private fb = inject(FormBuilder)
  private usuarioService = inject(AuthService)

  ngOnInit(): void {
    /*this.seoHelper.setupPageSeo({
      title: 'Recuperacion de clave | Assist Web',
      description: 'Recuperacion de claves por usuario Assist Web',
      schemaTitle: 'ContentPage'
    });*/

    this.resendForm = this.fb.group({
      usuario: ['', Validators.required]
    })
  }

  onSubmit() {
    this.loading = true;
    if (this.resendForm.invalid) {
      return
    }
    const usuario = this.resendForm.get('usuario')?.value;
    this.usuarioService.recoveryPassword(usuario).subscribe({
      next : value => {
        this.serviceResponse = value;
        this.response = true;
        this.loading = false;
      }, error: () => {this.loading = false}
    })
  }

}
