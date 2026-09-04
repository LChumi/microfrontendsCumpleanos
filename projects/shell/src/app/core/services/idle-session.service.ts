import {Injectable, NgZone} from '@angular/core';
import {Subject} from 'rxjs';
import {clearSessionItems} from '../utils/storage-utils';

@Injectable({
  providedIn: 'root'
})
export class IdleSessionService {

  private readonly WARNING_TIMEOUT = 20 * 60 * 1000; //20 min aviso
  private readonly LOGOUT_TIMEOUT  = 30 * 60 * 1000; //30 min cierre forzado

  private warningTimer!: ReturnType<typeof setTimeout>;
  private logoutTimer!: ReturnType<typeof setTimeout>;
  private started = false;

  private activityEvents = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
  private boundReset = this.resetTimers.bind(this);

  public onIdleWarning$ = new Subject<void>();
  public onSessionExpired$ = new Subject<void>();

  constructor(private zone: NgZone) {}

  start(){
    if (this.started){ return }
    this.started = true;

    this.zone.runOutsideAngular(() => {
      this.activityEvents.forEach(event => {
        document.addEventListener(event, this.boundReset, { passive: true });
      });
    });

    this.resetTimers();
  }

  stop(){
    this.started = false;
    this.activityEvents.forEach(event =>
      document.removeEventListener(event, this.boundReset)
    );

    clearTimeout(this.warningTimer);
    clearTimeout(this.logoutTimer);
  }

  //lama si el usuario responde alerta
  resetTimers(): void {
    clearTimeout(this.warningTimer);
    clearTimeout(this.logoutTimer);

    this.warningTimer = setTimeout(() => {
      this.zone.run(() => this.onIdleWarning$.next());
    }, this.WARNING_TIMEOUT);

    this.logoutTimer = setTimeout(() => {
      this.zone.run(() => this.expireSession());
    }, this.LOGOUT_TIMEOUT);
  }

  private expireSession(){
    clearSessionItems();
    this.stop();
    this.onSessionExpired$.next();
  }
}
