import {inject, Injectable, NgZone} from '@angular/core';
import {Subject} from 'rxjs';
import {clearSessionItems} from '../utils/storage-utils';
import {AuthService} from 'shared-auth';

@Injectable({
  providedIn: 'root'
})
export class IdleSessionService {

  private readonly authService = inject(AuthService);
  private readonly zone = inject(NgZone);

  private readonly WARNING_TIMEOUT = 50 * 60 * 1000;
  private readonly LOGOUT_TIMEOUT  = 60 * 60 * 1000;
  private readonly THROTTLE_MS = 1000;

  private warningTimer?: ReturnType<typeof setTimeout>;
  private logoutTimer?: ReturnType<typeof setTimeout>;
  private started = false;
  private warningShown = false;
  private lastReset = 0;

  private readonly activityEvents = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];

  // Misma referencia para add/removeEventListener
  private readonly onActivity = (): void => {
    if (this.warningShown) return;                              // modal abierto: ignorar
    if (Date.now() - this.lastReset < this.THROTTLE_MS) return; // throttle
    this.resetTimers();
  };

  public onIdleWarning$ = new Subject<void>();
  public onSessionExpired$ = new Subject<void>();

  start(): void {
    if (this.started) return;
    this.started = true;

    this.zone.runOutsideAngular(() => {
      this.activityEvents.forEach(e =>
        document.addEventListener(e, this.onActivity, { passive: true })
      );
    });

    this.resetTimers();
  }

  stop(): void {
    this.started = false;
    this.warningShown = false;
    this.activityEvents.forEach(e =>
      document.removeEventListener(e, this.onActivity)
    );
    clearTimeout(this.warningTimer);
    clearTimeout(this.logoutTimer);
  }

  //lama si el usuario responde alerta
  resetTimers(): void {
    this.warningShown = false;
    this.lastReset = Date.now();
    clearTimeout(this.warningTimer);
    clearTimeout(this.logoutTimer);

    this.warningTimer = setTimeout(() => {
      this.warningShown = true;
      this.zone.run(() => this.onIdleWarning$.next());
    }, this.WARNING_TIMEOUT);

    this.logoutTimer = setTimeout(() => {
      this.zone.run(() => this.expireSession());
    }, this.LOGOUT_TIMEOUT);
  }

  private expireSession(): void {
    this.stop();                 // primero detener, así no se dispara dos veces
    clearSessionItems();
    this.authService.logout();
    this.onSessionExpired$.next();
  }
}
