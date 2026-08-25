import {Component, inject, OnDestroy, OnInit} from '@angular/core';
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
import {MenuSyncService} from '../../../../../core/services/menu-sync.service';
import {Subscription} from 'rxjs';

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
export class RolMenuAsignacionComponent implements OnInit, OnDestroy {

  private service = inject(RolMenuService);
  private rolService = inject(RolWService);
  private menuService = inject(MenuWService);
  private messageService = inject(MessageService);
  private menuSync = inject(MenuSyncService);
  private sub = new Subscription();

  relaciones: RolMenu[] = [];
  roles: RolW[] = [];
  menus: MenuW[] = [];
  rutaPorId = new Map<any, string>();

  dialogVisible = false;
  isEditMode = false;
  form: Partial<RolMenu> = {};

  ngOnInit() {
    this.getAll();
    this.sub.add(this.menuSync.rolCreado.subscribe(() => this.cargarRoles()));
    this.sub.add(this.menuSync.menuCreado.subscribe(() => this.cargarMenus()));
  }

  getAll() {
    this.service.getAll().subscribe({next: data => this.relaciones = data});
    this.cargarRoles();
    this.cargarMenus();
  }

  cargarRoles(){
    this.rolService.getAll().subscribe({next: data => this.roles = data});
  }

  cargarMenus(){
    this.menuService.getAll().subscribe({
      next: data => {
        this.menus = data;
        this.rutaPorId = this.construirRutas(data);
      }
    });
  }

  // Arma "ABUELO > PADRE > NOMBRE" para cada menú, caminando por "reporta"
  private construirRutas(menus: MenuW[]): Map<any, string> {
    const porId = new Map(menus.map(m => [m.id, m]));
    const cache = new Map<any, string>();

    const rutaDe = (m: MenuW, visitados = new Set<any>()): string => {
      if (cache.has(m.id)) return cache.get(m.id)!;
      if (visitados.has(m.id)) return m.nombre; // por si hay un ciclo mal formado
      visitados.add(m.id);

      if (m.reporta == null) {
        cache.set(m.id, m.nombre);
        return m.nombre;
      }
      const padre = porId.get(m.reporta);
      const ruta = padre ? `${rutaDe(padre, visitados)} > ${m.nombre}` : m.nombre;
      cache.set(m.id, ruta);
      return ruta;
    };

    menus.forEach(m => rutaDe(m));
    return cache;
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

  ngOnDestroy() {
    this.sub.unsubscribe()
  }
}
