import {Component, OnInit} from '@angular/core';
import {getSessionItem} from '../../../../core/utils/storage.utils';
import {PendienteListComponent} from '../components/pendiente-list/pendiente-list.component';
import {ScrollTopComponent} from '../../../../shared/components/scroll-top/scroll-top.component';

@Component({
  selector: 'app-despacho',
  standalone: true,
  imports: [
    PendienteListComponent,
    ScrollTopComponent
  ],
  templateUrl: './despacho.component.html',
  styles: ``
})
export class DespachoComponent implements OnInit {

  usrId: any

  ngOnInit(): void {
    const username = getSessionItem("username");
    if (username) {
      this.usrId = username
    }
  }

}
