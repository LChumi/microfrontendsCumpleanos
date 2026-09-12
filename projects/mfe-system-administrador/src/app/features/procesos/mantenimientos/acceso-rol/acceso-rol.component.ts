import {Component, inject, signal} from '@angular/core';
import {AccesoRolService} from '../../../../core/services/acceso-rol.service';
import {UsuarioDTO} from '../../../../core/dto/usuario.dto';
import {AccesoRol} from '../../../../core/models/acceso-rol';
import {RolW} from '../../../../core/models/rol-w';
import {UsuarioBuscadorComponent} from './usuario-buscador/usuario-buscador.component';
import {ConfigurarAccesoComponent} from './configurar-acceso/configurar-acceso.component';
import {AccesosTablaComponent} from './accesos-tabla/accesos-tabla.component';

@Component({
  selector: 'app-acceso-rol',
  standalone: true,
  imports: [
    UsuarioBuscadorComponent,
    ConfigurarAccesoComponent,
    AccesosTablaComponent
  ],
  templateUrl: './acceso-rol.component.html',
  styles: ``
})
export class AccesoRolComponent {

  private accesoRolService = inject(AccesoRolService);

  usuario = signal<UsuarioDTO | null>(null)
  accesos = signal<AccesoRol[]>([])
  almacenActual = signal<number | null>(null);

  onUsuario(u: UsuarioDTO) {
    this.usuario.set(u);
    this.accesos.set([]);
    this.almacenActual.set(null);
  }

  onAlmacenSeleccionado(sel: { empresaId: number; almacenId: number }) {
    this.almacenActual.set(sel.almacenId);
    this.accesoRolService
      .getByUserAndAlmacen(this.usuario()!.codigo, sel.almacenId)
      .subscribe(r => this.accesos.set(r));
  }


  onAgregar(sel: {empresaId: number; empresaNombre: string; almacenId: number; almacenNombre: string; rol: RolW}){
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

  onEditar(acceso: AccesoRol){

  }

  onEliminar(acceso: AccesoRol){
    this.accesos.update(list => list.filter(a => a.id !== acceso.id));

  }

}
