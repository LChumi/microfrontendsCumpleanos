import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {ClarityService} from './core/services/clarity.service';
import {environment} from '../environments/environment';
import {PageHeaderService} from './core/services/page-header.service';
import {
  AlertDialogComponent,
  AlertDialogConfig,
  NotificationService,
  ToastComponent,
  ToastConfig
} from 'shared-notifications';
import {IdleSessionService} from './core/services/idle-session.service';
import {Subscription} from 'rxjs';
import {getSessionItem} from './core/utils/storage-utils';
import {IdleSessionModalComponent} from './shared/idle-session-modal/idle-session-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AlertDialogComponent, ToastComponent, IdleSessionModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy{

  private readonly clarityService = inject(ClarityService);
  private readonly pageHead = inject(PageHeaderService)
  private readonly notif = inject(NotificationService);
  private readonly idleSession = inject(IdleSessionService);
  private readonly router = inject(Router);

  private readonly projectId = environment.clarityId
  private subs: Subscription[] = []

  alertVisible = false;
  alertConfig?: AlertDialogConfig;
  showIdleWarningModal = false;
  toastVisible = false;
  toastConfig?: ToastConfig;

  title = 'Assist Web';

  private onLoggedIn = () => this.idleSession.start();
  private onLoggedOut = () => this.idleSession.stop();

  constructor() {
    this.clarityService.init(this.projectId);
  }

  ngOnInit() {
    this.pageHead.init()

    this.notif.alert$.subscribe(cfg => {
      this.alertConfig = cfg;
      this.alertVisible = true;
    });

    this.notif.toast$.subscribe(cfg => {
      this.toastConfig = cfg;
      this.toastVisible = true;
    });

    //Idle session
    if (getSessionItem('usrId')){
      this.idleSession.start();
    }

    window.addEventListener('user-logged-in', this.onLoggedIn)
    window.addEventListener('user-logged-out', this.onLoggedOut)

    this.subs.push(
      this.idleSession.onIdleWarning$.subscribe(() => {
        this.showIdleWarningModal = true
      })
    );

    this.subs.push(
      this.idleSession.onSessionExpired$.subscribe(() => {
        this.showIdleWarningModal = false
        this.router.navigate(['/auth/login']).then(() => {})
      })
    )
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    window.removeEventListener('user-logged-in', this.onLoggedIn);
    window.removeEventListener('user-logged-out', this.onLoggedOut);
    this.idleSession.stop();
  }
}
