import {Component, inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {ButtonDirective} from 'primeng/button';

@Component({
  selector: 'app-remote-error',
  standalone: true,
  imports: [
    ButtonDirective
  ],
  templateUrl: './remote-error.component.html',
  styles: ``
})
export class RemoteErrorComponent implements OnInit{

  private route = inject(Router)

  errorMessage = '';

  ngOnInit() {
    const nav = this.route.getCurrentNavigation();
    this.errorMessage = nav?.extras.state?.['error'] || '';
  }

  retry(){
    window.location.reload();
  }

  goHome(){
    this.route.navigate(['/']).then(() => {});
  }

}
