import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {clearSessionItems} from '../../core/utils/storage-utils';
import {IdleSessionService} from '../../core/services/idle-session.service';
import {Router} from '@angular/router';
import {AuthService} from 'shared-auth';

@Component({
  selector: 'app-idle-session-modal',
  standalone: true,
  imports: [],
  templateUrl: './idle-session-modal.component.html',
  styles: ``
})
export class IdleSessionModalComponent {

  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly idleSession = inject(IdleSessionService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  continueSession(){
    this.visibleChange.emit(false);
    this.idleSession.resetTimers();
  }

  logoutNow(): void {
    this.idleSession.stop();
    this.authService.logout();   // limpia token en memoria + borra cookie en el server
    clearSessionItems();
    window.dispatchEvent(new CustomEvent('user-logged-out'));
    this.visibleChange.emit(false);
    this.router.navigate(['/auth/login']);
  }
}
