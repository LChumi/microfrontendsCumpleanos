import {Component, ElementRef, inject, ViewChild} from '@angular/core';
import {ChipsModule} from "primeng/chips";
import {ButtonDirective} from "primeng/button";
import {LayoutService} from '../../service/layout.service';
import {BreadcrumbComponent} from '../breadcrumb/breadcrumb.component';
import {getSessionItem} from '../../../core/utils/storage-utils';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    ChipsModule,
    ButtonDirective,
  ],
  templateUrl: './topbar.component.html',
  styles: ``
})
export class TopbarComponent {
  @ViewChild('menubutton') menuButton!: ElementRef;

  private layoutService = inject(LayoutService)
  empresa: any

  constructor() {
    this.empresa = getSessionItem('nombreEmpresa')
  }

  onMenuButtonClick() {
    this.layoutService.onMenuToggle();
  }

  onProfileButtonClick() {
    this.layoutService.showProfileSidebar();
  }

  onConfigButtonClick() {
    this.layoutService.showConfigSidebar();
  }

}
