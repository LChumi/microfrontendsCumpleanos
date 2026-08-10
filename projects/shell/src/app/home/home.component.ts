import { NgOptimizedImage } from "@angular/common";
import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";
import { ButtonDirective } from "primeng/button";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ButtonDirective,
    RouterLink,
    NgOptimizedImage
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
