import {Component, inject, OnInit} from '@angular/core';
import {TableModule} from 'primeng/table';
import {DialogModule} from 'primeng/dialog';
import {Button} from 'primeng/button';
import {MessageService} from 'primeng/api';
import {RolWService} from '../../../../../core/services/rol-w.service';
import {RolW} from '../../../../../core/models/rol-w';
import {FormsModule} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';
import {MenuSyncService} from '../../../../../core/services/menu-sync.service';
import {SeguridadService} from '../../../../../core/services/seguridad.service';
import {Seguridad} from '../../../../../core/models/seguridad';
import {DropdownModule} from 'primeng/dropdown';

@Component({
  selector: 'app-rol',
  standalone: true,
  imports: [
    TableModule,
    DialogModule,
    Button,
    FormsModule,
    InputTextModule,
    DropdownModule
  ],
  templateUrl: './rol.component.html',
  styles: ``
})
export class RolComponent implements OnInit {

  private rolwService = inject(RolWService);
  private messageService = inject(MessageService);
  private menuSync = inject(MenuSyncService)
  private seguridadService = inject(SeguridadService);

  roles: RolW[] = [];
  listSeguridad: Seguridad[] = [];
  dialogVisible = false;
  isEditMode = false;
  form: Partial<RolW> = {};

  ngOnInit() {
    this.getAll();
    this.getSeguridades()
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

  private getSeguridades(){
    this.seguridadService.getAll().subscribe({
      next: data => this.listSeguridad = data
    })
  }

  save() {
    const payload: RolW = {
      ...this.form,
      rlwId: this.form.rlwId!.toUpperCase(),
      nombre: this.form.nombre!.toUpperCase(),
      seguridad: this.form.seguridad!
    }
    const request$ = this.isEditMode ? this.rolwService.update(payload) : this.rolwService.create(payload);
    request$.subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Éxito', detail: 'Guardado correctamente'});
        this.dialogVisible = false;
        this.getAll();
        this.menuSync.notificarRolCreado();
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
