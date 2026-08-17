import {Component, inject} from '@angular/core';
import {AccesoService} from '../../core/services/acceso.service';
import {Empresa} from '../../core/models/empresa';
import {NgOptimizedImage} from '@angular/common';
import {getSessionItem, setSessionItem} from '../../core/utils/storage.utils';

@Component({
  selector: 'app-empresa.ts',
  standalone: true,
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './empresas.component.html',
  styles: ``
})
export class EmpresasComponent {

  private menuService = inject(AccesoService)

  listasEmpresa: Empresa[] = []

  ngOnInit(): void {

    const usrIdString = getSessionItem('usrId')
    if (usrIdString) {
      const usrId = Number(usrIdString)
      this.menuService.getEmpresas(usrId).subscribe(
        empresas => {
          this.listasEmpresa = empresas
        }
      )
    }
  }

  empresaSelected(empresa: Empresa) {
    if (empresa) {
      setSessionItem('empresa', String(empresa.id))
      setSessionItem('nombreEmpresa', empresa.nombre)
      this.goToInicio()
    }
  }

  //navegar fuera del router del remote usando Location
  goToInicio() {
    window.location.href = '/erp/dashboard/inicio'
  }

}
