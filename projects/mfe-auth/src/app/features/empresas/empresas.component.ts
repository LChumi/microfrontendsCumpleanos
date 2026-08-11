import {Component, inject} from '@angular/core';
import {Router} from '@angular/router';
import {getSessionItem, setSessionItem} from '../../../../../shell/src/app/core/utils/storage-utils';
import {AccesoService} from '../../core/services/acceso.service';
import {Empresa} from '../../core/models/empresa';
import {NgOptimizedImage} from '@angular/common';

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
  private router = inject(Router)

  listasEmpresa: Empresa[] = []

  ngOnInit(): void {
    /*this.seoHelper.setupPageSeo({
      title: 'Seleccion Empresa | Assist Web',
      description: 'Lista de empresa.ts asignadas al usuario en el sistema assist',
      schemaTitle: 'ContentPage'
    });*/

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

  goToInicio() {
    this.router.navigate(['/inicio', 'dashboard']).then(() => {})
  }

}
