import { Component } from '@angular/core';
import {TabViewModule} from 'primeng/tabview';
import {MenuTreeComponent} from '../components/menu-tree/menu-tree.component';
import {ProgramaComponent} from '../components/programa/programa.component';
import {RolComponent} from '../components/rol/rol.component';
import {RolMenuAsignacionComponent} from '../components/rol-menu-asignacion/rol-menu-asignacion.component';

@Component({
  selector: 'app-menus-sistema',
  standalone: true,
  imports: [
    TabViewModule,
    MenuTreeComponent,
    ProgramaComponent,
    RolComponent,
    RolMenuAsignacionComponent
  ],
  templateUrl: './menus-sistema.component.html',
  styles: ``
})
export class MenusSistemaComponent {

}
