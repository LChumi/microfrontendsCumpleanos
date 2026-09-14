import {Component, effect, inject, input, output, signal} from '@angular/core';
import {RolW} from '../../../../../core/models/rol-w';
import {EmpresaService} from '../../../../../core/services/empresa.service';
import {RolWService} from '../../../../../core/services/rol-w.service';
import {AlmacenService} from '../../../../../core/services/almacen.service';
import {Sistema} from '../../../../../core/models/sistema';
import {Almacen} from '../../../../../core/models/almacen';
import {FormsModule} from '@angular/forms';
import {AccesoRol} from '../../../../../core/models/acceso-rol';

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

  accesoEditar = input<AccesoRol | null>(null)

  agregar = output<{
    empresaId: number; empresaNombre: string;
    almacenId: number; almacenNombre: string;
    rol: RolW
  }>();

  actualizar = output<AccesoRol>();
  cancelarEdicion = output<void>();

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

  constructor() {
    effect(() => {
      const acceso = this.accesoEditar();
      if (acceso) {
        this.empresaId = acceso.empresa;
        this.rolId = acceso.rolW.id ?? null;
        this.almacenService.getByEmpresa(acceso.empresa).subscribe(r => {
          this.almacenes.set(r);
          this.almacenId = acceso.almacen; // ya con la lista cargada, selecciona el actual
        });
      }
    });
  }

  ngOnInit() {
    this.empresaService.listEmpresas().subscribe(r => this.empresas.set(r));
    this.rolWService.getAll().subscribe(r => this.roles.set(r));
  }

  onEmpresaChange() {
    this.almacenId = null;
    this.almacenes.set([]);
    if (this.empresaId) {
      this.almacenService.getByEmpresa(this.empresaId).subscribe(r => this.almacenes.set(r));
    }
  }

  onAlmacenChange() {
    if (this.empresaId && this.almacenId) {
      this.almacenSeleccionado.emit({empresaId: this.empresaId, almacenId: this.almacenId});
    }
  }

  puedeAgregar(): boolean {
    return !!(this.empresaId && this.almacenId && this.rolId);
  }

  onAgregarClick() {
    const empresa = this.empresas().find(e => e.id === this.empresaId);
    const almacen = this.almacenes().find(a => a.codigo === this.almacenId);
    const rol = this.roles().find(r => r.id === this.rolId);

    if (this.accesoEditar()) {
      const actualizado: AccesoRol = {
        ...this.accesoEditar()!,
        empresa: empresa!.id,
        almacen: almacen!.codigo,
        rolW: rol!
      };
      this.actualizar.emit(actualizado);
    } else {
      this.agregar.emit({
        empresaId: empresa!.id,
        empresaNombre: empresa!.nombrecorto,
        almacenId: almacen!.codigo,
        almacenNombre: almacen!.nombre,
        rol: rol!
      });
    }

    this.limpiar();

  }

  onCancelar() {
    this.limpiar();
    this.cancelarEdicion.emit();
  }

  private limpiar() {
    this.rolId = null;
    if (this.accesoEditar()) {
      this.empresaId = null;
      this.almacenId = null;
      this.almacenes.set([]);
    }
  }

}
