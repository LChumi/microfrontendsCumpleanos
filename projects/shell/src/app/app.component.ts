import {Component, inject, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {ClarityService} from './core/services/clarity.service';
import {environment} from '../environments/environment';
import {PageHeaderService} from './core/services/page-header.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{

  private clarityService = inject(ClarityService);
  private pageHead = inject(PageHeaderService)
  private projectId = environment.clarityId

  title = 'shell';

  constructor() {
    this.clarityService.init(this.projectId);
  }

  ngOnInit() {
    this.pageHead.init()
  }

}
