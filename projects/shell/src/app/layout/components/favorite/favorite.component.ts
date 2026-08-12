import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {Subject, takeUntil} from 'rxjs';
import {filter} from 'rxjs/operators';
import {FavoriteRequest} from '../../../core/models/favorite.request';
import {getSessionItem} from '../../../core/utils/storage-utils';
import {FavoriteService} from '../../../core/services/favorite.service';
import {ButtonDirective} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';

@Component({
  selector: 'app-favorite',
  standalone: true,
  imports: [
    ButtonDirective,
    TooltipModule
  ],
  templateUrl: './favorite.component.html',
  styles: ``
})
export class FavoriteComponent implements OnInit, OnDestroy {

  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly favoriteService = inject(FavoriteService);

  private readonly destroy$ = new Subject<void>();

  public isFavorite = false;
  public canFavorite = false;
  public title = '';


  ngOnInit(): void {

    this.updateRouteState();

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateRouteState();
      });
  }


  private updateRouteState(): void {

    const route = this.getActiveRoute();

    const data = route.snapshot.data;

    this.canFavorite = data['favorite'] === true;

    this.title = data['breadcrumb'] ?? '';

    if (!this.canFavorite) {
      this.isFavorite = false;
      return;
    }

    this.loadFavoriteState();
  }


  private loadFavoriteState(): void {

    const favoriteRequest = this.buildFavoriteRequest();

    this.favoriteService
      .isFavorited(favoriteRequest)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: isFavorite => {
          this.isFavorite = isFavorite;
        },
        error: () => {
          this.isFavorite = false;
        }
      });
  }


  toggleFavorite(): void {

    if (!this.canFavorite) {
      return;
    }

    const favoriteRequest = this.buildFavoriteRequest();

    if (this.isFavorite) {

      this.favoriteService
        .deleteFavorite(favoriteRequest)
        .pipe(
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.isFavorite = false;
        });

      return;
    }

    this.favoriteService
      .addFavorite(favoriteRequest)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isFavorite = true;
      });
  }


  private buildFavoriteRequest(): FavoriteRequest {

    return {
      empresa: Number(getSessionItem('empresa')),
      path: this.router.url,
      idUsuario: Number(getSessionItem('usuario'))
    };
  }


  private getActiveRoute(): ActivatedRoute {

    let route = this.activatedRoute;

    while (route.firstChild) {
      route = route.firstChild;
    }

    return route;
  }


  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();
  }
}
