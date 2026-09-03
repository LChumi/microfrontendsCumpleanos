import {Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {NgClass} from '@angular/common';
import {NotificationType} from '../shared-notifications.service';

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [
    NgClass
  ],
  templateUrl: './alert-dialog.component.html',
  styles: ``
})
export class AlertDialogComponent {
  @Input() visible = false;
  @Input() type: NotificationType = 'success';
  @Input() title = '';
  @Input() message = '';
  @Input() okLabel = 'OK';
  @Input() closeOnEscape = true;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() accept = new EventEmitter<void>();

  private readonly icons: Record<NotificationType, string> = {
    success: 'M4.5 12.75l6 6 9-13.5',
    warning: 'M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    error:
      'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z',
    info: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  private readonly colors: Record<NotificationType, string> = {
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    error: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
  };

  get iconPath(): string {
    return this.icons[this.type];
  }

  get iconClasses(): string {
    return this.colors[this.type];
  }

  onAccept(): void {
    this.accept.emit();
    this.close();
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  @HostListener('document:keydown.enter')
  onEnter(): void {
    if (this.visible) this.onAccept();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible && this.closeOnEscape) this.close();
  }
}
