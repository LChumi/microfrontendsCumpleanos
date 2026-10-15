import {Component, computed, inject, signal} from '@angular/core';
import {AccesoRolService} from '../../../../core/services/acceso-rol.service';
import {UsuarioDTO} from '../../../../core/dto/usuario.dto';
import {AccesoRol} from '../../../../core/models/acceso-rol';
import {RolW} from '../../../../core/models/rol-w';
import {UsuarioBuscadorComponent} from './usuario-buscador/usuario-buscador.component';
import {ConfigurarAccesoComponent} from './configurar-acceso/configurar-acceso.component';
import {AccesosTablaComponent} from './accesos-tabla/accesos-tabla.component';
import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'app-acceso-rol',
  standalone: true,
  imports: [
    UsuarioBuscadorComponent,
    ConfigurarAccesoComponent,
    AccesosTablaComponent,
    NgTemplateOutlet
  ],
  templateUrl: './acceso-rol.component.html',
  styles: ``
})
export class AccesoRolComponent {

  private accesoRolService = inject(AccesoRolService);

  usuario = signal<UsuarioDTO | null>(null)
  accesos = signal<AccesoRol[]>([])
  almacenActual = signal<number | null>(null);

  accesoEditando = signal<AccesoRol | null>(null);

  onUsuario(u: UsuarioDTO) {
    this.usuario.set(u);
    this.accesos.set([]);
    this.almacenActual.set(null);
    this.accesoEditando.set(null);
  }

  readonly iniciales = computed(() => {
    const nombre = this.usuario()?.nombre?.trim() ?? '';
    return nombre
      .split(/\s+/)
      .slice(0, 2)
      .map(p => p[0])
      .join('');
  });

  private readonly colores: Record<string, string> = {
    blue:    'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-600',
  };

  pasoColor(color: string): string {
    return this.colores[color] ?? this.colores['blue'];
  }

  onAlmacenSeleccionado(sel: { empresaId: number; almacenId: number }) {
    this.almacenActual.set(sel.almacenId);
    this.accesoRolService
      .getByUserAndAlmacenAndEmpresa(this.usuario()!.codigo, sel.almacenId, sel.empresaId)
      .subscribe(r => this.accesos.set(r));
  }

  onAgregar(sel: { empresaId: number; empresaNombre: string; almacenId: number; almacenNombre: string; rol: RolW }) {
    const nuevo: AccesoRol = {
      empresa: sel.empresaId,
      almacen: sel.almacenId,
      usuario: this.usuario()!.codigo,
      orden: this.accesos().length,
      rolW: sel.rol
    };

    this.accesoRolService.create(nuevo).subscribe(creado => {
      this.accesos.update(List => [...List, creado]);
    })
  }

  onEditar(acceso: AccesoRol) {
    this.accesoEditando.set(acceso);
  }

  onActualizar(acceso: AccesoRol) {
    this.accesoRolService.update(acceso).subscribe(actualizado => {
      this.accesos.update(list =>
        list.map(a => a.id === actualizado.id ? actualizado : a)
      );
      this.accesoEditando.set(null);
    });
  }

  onCancelarEdicion() {
    this.accesoEditando.set(null);
  }

  onEliminar(acceso: AccesoRol) {
    if (!acceso.id) return;

    if (!confirm('¿Eliminar este acceso?')) return;

    this.accesoRolService.delete(acceso.id).subscribe({
      next: () => {
        this.accesos.update(list => list.filter(a => a.id !== acceso.id));

        // si estabas editando justo ese acceso, cancela la edición
        if (this.accesoEditando()?.id === acceso.id) {
          this.accesoEditando.set(null);
        }
      },
      error: err => console.error('Error al eliminar el acceso', err),
    });
  }

}
