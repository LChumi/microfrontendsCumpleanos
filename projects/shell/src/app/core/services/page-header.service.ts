import {inject, Injectable} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs';
import {Title} from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class PageHeaderService {

  private title = inject(Title);
  private router = inject(Router);

  private readonly domain = 'https://assist.cumpleanos.com.ec';

  private initialized = false;

  init(): void {

    if (this.initialized) {
      return;
    }

    this.initialized = true;

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe(() => {

        const route = this.findDeepestRoute(
          this.router.routerState.root
        );

        const pageTitle = route.snapshot.title;

        if (pageTitle) {
          this.title.setTitle(pageTitle);
        }

        this.updateCanonical(
          `${this.domain}${this.router.url}`
        );
      });
  }

  private findDeepestRoute(
    route: ActivatedRoute
  ): ActivatedRoute {

    while (route.firstChild) {
      route = route.firstChild;
    }

    return route;
  }

  private updateCanonical(url: string): void {

    const link = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;

    if (link) {
      link.setAttribute('href', url);
    }
  }
}
