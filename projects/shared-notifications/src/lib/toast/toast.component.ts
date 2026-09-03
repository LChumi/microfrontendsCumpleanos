import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {NotificationType} from '../shared-notifications.service';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [
    NgClass
  ],
  templateUrl: './toast.component.html',
  styles: ``
})
export class ToastComponent implements OnChanges {
  @Input() visible = false;
  @Input() summary = '';
  @Input() type: NotificationType = 'success';
  @Input() detail = 'Cierre la ventana por favor';
  @Input() autoCloseMs?: number; // ej. 5000, opcional

  @Output() visibleChange = new EventEmitter<boolean>();

  private timer?: ReturnType<typeof setTimeout>;

  private readonly colors: Record<NotificationType, string> = {
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    error: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600'
  };

  private readonly borders: Record<NotificationType, string> = {
    success: 'border-green-200',
    warning: 'border-amber-200',
    error: 'border-red-200',
    info: 'border-blue-200'
  };

  private readonly focusColors: Record<NotificationType, string> = {
    success: 'focus:ring-green-400',
    warning: 'focus:ring-amber-400',
    error: 'focus:ring-red-400',
    info: 'focus:ring-blue-400'
  };

  get iconClasses(): string {
    return this.colors[this.type];
  }

  get borderClasses(): string {
    return this.borders[this.type];
  }

  get focusClasses(): string {
    return this.focusColors[this.type];
  }

  ngOnChanges(): void {
    clearTimeout(this.timer);

    if (this.visible && this.autoCloseMs) {
      this.timer = setTimeout(() => this.close(), this.autoCloseMs);
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
