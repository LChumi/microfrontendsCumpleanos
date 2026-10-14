import {Component, inject, OnInit} from '@angular/core';
import {getSessionItem} from '../../../../core/utils/storage.utils';
import {PendienteListComponent} from '../components/pendiente-list/pendiente-list.component';
import {Router} from '@angular/router';

@Component({
  selector: 'app-despacho',
  standalone: true,
  imports: [
    PendienteListComponent
  ],
  templateUrl: './despacho.component.html',
  styles: ``
})
export class DespachoComponent implements OnInit {

  private readonly router = inject(Router);

  usrId: any

  ngOnInit(): void {
    const username = getSessionItem("username");
    if (username) {
      this.usrId = username
    }
  }

  regresar() {
    this.router.navigate(['/erp/pedidos/comercial/pedido-clientes']).then(() => {});
  }

  regresarmp() {
    this.router.navigate(['/erp/pedidos/comercial/mapas-vendedores']).then(() => {});
  }

}
