import {Component, inject, OnInit} from '@angular/core';
import {MenusService} from '../../../core/services/menus.service';
import {getSessionItem} from '../../../core/utils/storage-utils';
import {MenuitemComponent} from '../menu-item/menuitem.component';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    MenuitemComponent
  ],
  templateUrl: './app-menu.component.html',
  styles: ``
})
export class AppMenuComponent implements OnInit {

  private menuService = inject(MenusService)

  protected model: any[] = [];

  ngOnInit() {
    const usrIdStr = getSessionItem('usrId')
    const empresaStr = getSessionItem('empresa')
    if (usrIdStr && empresaStr) {
      const usrId = Number(usrIdStr)
      const empresa = Number(empresaStr)
      this.menuService.getMenus(usrId, empresa).subscribe(
        menus => {
          this.model = menus
        }
      )
    }
  }

}
