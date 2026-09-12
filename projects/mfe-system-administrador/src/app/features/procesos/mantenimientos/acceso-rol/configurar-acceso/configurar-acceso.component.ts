import {Component, inject, output, signal} from '@angular/core';
import {RolW} from '../../../../../core/models/rol-w';
import {EmpresaService} from '../../../../../core/services/empresa.service';
import {RolWService} from '../../../../../core/services/rol-w.service';
import {AlmacenService} from '../../../../../core/services/almacen.service';
import {Sistema} from '../../../../../core/models/sistema';
import {Almacen} from '../../../../../core/models/almacen';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-configurar-acceso',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './configurar-acceso.component.html',
  styles: ``
})
export class ConfigurarAccesoComponent {

  agregar = output<{
    empresaId: number; empresaNombre: string;
    almacenId: number; almacenNombre: string;
    rol: RolW
  }>();

  almacenSeleccionado = output<{ empresaId: number; almacenId: number }>();

  private empresaService = inject(EmpresaService);
  private almacenService = inject(AlmacenService);
  private rolWService = inject(RolWService)

  empresas = signal<Sistema[]>([])
  almacenes = signal<Almacen[]>([])
  roles = signal<RolW[]>([])

  empresaId: number | null = null;
  almacenId: number | null = null;
  rolId: number | null = null;

  ngOnInit() {
    this.empresaService.listEmpresas().subscribe( r => this.empresas.set(r));
    this.rolWService.getAll().subscribe( r => this.roles.set(r));
  }

  onEmpresaChange() {
    this.almacenId = null;
    this.almacenes.set([]);
    if(this.empresaId){
      this.almacenService.getByEmpresa(this.empresaId).subscribe( r => this.almacenes.set(r));
    }
  }

  onAlmacenChange() {
    if (this.empresaId && this.almacenId) {
      this.almacenSeleccionado.emit({ empresaId: this.empresaId, almacenId: this.almacenId });
    }
  }

  puedeAgregar(): boolean {
    return !!(this.empresaId && this.almacenId && this.rolId);
  }

  onAgregarClick() {
    const empresa = this.empresas().find(e => e.id === this.empresaId);
    const almacen = this.almacenes().find(a => a.codigo === this.almacenId);
    const rol = this.roles().find(r => r.id === this.rolId);

    this.agregar.emit({
      empresaId: empresa!.id,
      empresaNombre: empresa!.nombrecorto,
      almacenId: almacen!.codigo,
      almacenNombre: almacen!.nombre,
      rol: rol!
    });

    this.rolId = null

  }

}
