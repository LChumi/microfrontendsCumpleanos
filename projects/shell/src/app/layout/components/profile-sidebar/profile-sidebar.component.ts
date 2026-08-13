import {Component, inject} from '@angular/core';
import {SidebarModule} from "primeng/sidebar";
import {BadgeModule} from "primeng/badge";
import {LayoutService} from '../../service/layout.service';
import {clearSessionItems, getSessionItem} from '../../../core/utils/storage-utils';

@Component({
  selector: 'app-profilemenu',
  standalone: true,
  imports: [
    SidebarModule,
    BadgeModule
  ],
  templateUrl: './profile-sidebar.component.html'
})
export class ProfileSidebarComponent {

  nombre: any;
  username: any;
  private layoutService = inject(LayoutService)

  constructor() {
    this.nombre = getSessionItem('nombre');
    this.username = getSessionItem('username');
  }

  get visible(): boolean {
    return this.layoutService.state.profileSidebarVisible;
  }

  set visible(_val: boolean) {
    this.layoutService.state.profileSidebarVisible = _val;
  }

  signOut(): void {
    clearSessionItems();
    this.visible = false;
    window.location.href='/auth/login'
  }
}
