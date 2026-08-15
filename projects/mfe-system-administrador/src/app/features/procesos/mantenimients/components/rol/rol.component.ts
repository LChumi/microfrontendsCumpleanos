import {Component, inject, OnInit} from '@angular/core';
import {TableModule} from 'primeng/table';
import {DialogModule} from 'primeng/dialog';
import {Button} from 'primeng/button';
import {MessageService} from 'primeng/api';
import {RolWService} from '../../../../../core/services/rol-w.service';
import {RolW} from '../../../../../core/models/rol-w';
import {FormsModule} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';

@Component({
  selector: 'app-rol',
  standalone: true,
  imports: [
    TableModule,
    DialogModule,
    Button,
    FormsModule,
    InputTextModule
  ],
  templateUrl: './rol.component.html',
  styles: ``
})
export class RolComponent implements OnInit {

  private rolwService = inject(RolWService);
  private messageService = inject(MessageService);

  roles: RolW[] = [];
  dialogVisible = false;
  isEditMode = false;
  form: Partial<RolW> = {};

  ngOnInit() {
    this.getAll();
  }

  getAll() {
    this.rolwService.getAll().subscribe({next: data => this.roles = data});
  }

  openNew() {
    this.isEditMode = false;
    this.form = {};
    this.dialogVisible = true;
  }

  openEdit(rol: RolW) {
    this.isEditMode = true;
    this.form = {...rol};
    this.dialogVisible = true;
  }

  save() {
    const payload = this.form as RolW;
    const request$ = this.isEditMode ? this.rolwService.update(payload) : this.rolwService.create(payload);
    request$.subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Éxito', detail: 'Guardado correctamente'});
        this.dialogVisible = false;
        this.getAll();
      },
      error: err => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message ?? 'No se pudo guardar'
        });
      }
    });
  }
}
