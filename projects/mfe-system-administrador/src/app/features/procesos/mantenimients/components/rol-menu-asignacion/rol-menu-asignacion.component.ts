import {Component, inject, OnInit} from '@angular/core';
import {Button} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {DialogModule} from 'primeng/dialog';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule} from '@angular/forms';
import {RolWService} from '../../../../../core/services/rol-w.service';
import {MenuWService} from '../../../../../core/services/menu-w.service';
import {MessageService} from 'primeng/api';
import {RolW} from '../../../../../core/models/rol-w';
import {MenuW} from '../../../../../core/models/menu-w';
import {RolMenuService} from '../../../../../core/services/rol-menu.service';
import {RolMenu} from '../../../../../core/models/rol-menu';

@Component({
  selector: 'app-rol-menu-asignacion',
  standalone: true,
  imports: [
    Button,
    TableModule,
    DialogModule,
    DropdownModule,
    FormsModule
  ],
  templateUrl: './rol-menu-asignacion.component.html',
  styles: ``
})
export class RolMenuAsignacionComponent implements  OnInit{

  private service = inject(RolMenuService);
  private rolService = inject(RolWService);
  private menuService = inject(MenuWService);
  private messageService = inject(MessageService);

  relaciones: RolMenu[] = [];
  roles: RolW[] = [];
  menus: MenuW[] = [];
  dialogVisible = false;
  isEditMode = false;
  form: Partial<RolMenu> = {};

  ngOnInit() {
    this.getAll();
    this.rolService.getAll().subscribe({next: data => this.roles = data});
    this.menuService.getAll().subscribe({next: data => this.menus = data});
  }

  getAll() {
    this.service.getAll().subscribe({next: data => this.relaciones = data});
  }

  openNew() {
    this.isEditMode = false;
    this.form = {};
    this.dialogVisible = true;
  }

  openEdit(rel: RolMenu) {
    this.isEditMode = true;
    this.form = {...rel};
    this.dialogVisible = true;
  }

  save() {
    if (!this.form.rolW || !this.form.menuW) {
      this.messageService.add({severity: 'warn', summary: 'Atención', detail: 'Selecciona rol y menú'});
      return;
    }
    const payload = this.form as RolMenu;
    const request$ = this.isEditMode ? this.service.update(payload) : this.service.create(payload);
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
