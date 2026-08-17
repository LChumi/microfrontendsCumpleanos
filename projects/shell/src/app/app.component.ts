import {Component, inject} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {ClarityService} from './core/services/clarity.service';
import {environment} from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  private clarityService = inject(ClarityService);
  private projectId = environment.clarityId

  title = 'shell';

  constructor() {
    this.clarityService.init(this.projectId);
  }

}
