import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [],
  templateUrl: './toast.component.html',
  styles: ``
})
export class ToastComponent implements OnChanges {
  @Input() visible = false;
  @Input() summary = '';
  @Input() detail = 'Cierre la ventana por favor';
  @Input() autoCloseMs?: number; // ej. 5000, opcional

  @Output() visibleChange = new EventEmitter<boolean>();

  private timer?: ReturnType<typeof setTimeout>;

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
