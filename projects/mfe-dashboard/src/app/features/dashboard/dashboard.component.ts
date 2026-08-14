import {Component, inject} from '@angular/core';
import {UsuarioFavorito} from '../../core/models/usuario-favorito';
import {FavoriteService} from '../../core/services/favorite.service';
import {AccesoService} from '../../core/services/acceso.service';
import {getSessionItem, setSessionItem} from '../../core/utils/storage.utils';
import {getCurrentDateNow, getCurrentTime} from '../../core/utils/date.utils';
import {DataViewModule} from 'primeng/dataview';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DataViewModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './dashboard.component.html',
  styles: ``
})
export class DashboardComponent {
  nombre: any;
  imageUsr: any
  fecha: any;
  hora: any;
  favoritos: UsuarioFavorito[] = [];
  layout: any = 'grid';

  private favoritoService = inject(FavoriteService)
  private accesoService = inject(AccesoService)


  ngOnInit(): void {
    this.getNameLastName()
    this.getDate()
    const usrId = getSessionItem("usrId");
    const empresaId = getSessionItem("empresa");
    this.getFavoritos(usrId, empresaId)
    this.getAccesos(usrId, empresaId)
  }

  getFavoritos(usuario: any, empresa: any) {
    this.favoritoService.getFavorites(usuario, empresa).subscribe({
      next: data => {
        this.favoritos = data
      }
    })
  }

  getDate() {
    this.fecha = getCurrentDateNow();
    this.hora = getCurrentTime();

  }

  getNameLastName() {
    this.nombre = getSessionItem('nombre');
    const nombres = this.nombre.split(' ');
    let name = nombres[0];
    let lastName = '';

    if (nombres.length > 2) {
      lastName = nombres[2];
    } else if (nombres.length > 1) {
      lastName = nombres[1];
    }

    this.nombre = (lastName ? lastName + ' ' : '') + name;
    return this.nombre;
  }

  getAccesos(usrId:any, empresaId:any) {
    this.accesoService.getAcceso(usrId,empresaId).subscribe({
      next: data => {
        setSessionItem("almId", String(data.almacen))
        setSessionItem("pventa", String(data.pVenta))
      }
    })
  }
}
