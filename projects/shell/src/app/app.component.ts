import {Component, inject, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AlertDialogComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{

  private clarityService = inject(ClarityService);
  private pageHead = inject(PageHeaderService)
  private notif = inject(NotificationService);
  private projectId = environment.clarityId

  alertVisible = false;
  alertConfig?: AlertDialogConfig;

  toastVisible = false;
  toastConfig?: ToastConfig;

  title = 'shell';

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
  }

}
