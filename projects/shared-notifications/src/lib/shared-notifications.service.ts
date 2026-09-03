import { Injectable } from '@angular/core';
import {Subject} from 'rxjs';

export type AlertDialogType = 'success' | 'warning' | 'error' | 'info';

export interface AlertDialogConfig {
  type?: AlertDialogType;
  title: string;
  message: string;
  okLabel?: string;
  closeOnEscape?: boolean;
}

export interface ToastConfig {
  summary: string;
  detail?: string;
  autoCloseMs?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService  {
  private alertSubject = new Subject<AlertDialogConfig>();
  private toastSubject = new Subject<ToastConfig>();

  alert$ = this.alertSubject.asObservable();
  toast$ = this.toastSubject.asObservable();

  showAlert(config: AlertDialogConfig): void {
    this.alertSubject.next({
      type: 'info',
      okLabel: 'OK',
      closeOnEscape: true,
      ...config,
    });
  }

  showToast(config: ToastConfig): void {
    this.toastSubject.next(config);
  }
}
