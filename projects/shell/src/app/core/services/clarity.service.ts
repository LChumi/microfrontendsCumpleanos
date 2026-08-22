import {inject, Injectable} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter, take} from "rxjs";
import clarity from '@microsoft/clarity'

@Injectable({
  providedIn: 'root'
})
export class ClarityService {

  private readonly router = inject(Router);

  private initialized = false;

  /**
   * Rutas que no deben ser registradas por Clarity.
   */
  private readonly excludedPatterns: RegExp[] = [
    /^\/payments\/deuna(\/.*)?$/,
    /^\/payments\/jep-faster(\/.*)?$/,
  ];

  /**
   * Inicializa Clarity cuando exista una navegación válida.
   */
  init(projectId: string): void {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd =>
          event instanceof NavigationEnd
        ),
        filter(event => {
          const url = this.cleanUrl(event.urlAfterRedirects);
          return !this.isExcludedRoute(url);
        }),
        take(1)
      )
      .subscribe(() => {
        clarity.init(projectId);

        this.initialized = true;

        this.trackRoutes();
      });
  }

  /**
   * Registra los cambios de ruta después de inicializar Clarity.
   */
  private trackRoutes(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd =>
          event instanceof NavigationEnd
        )
      )
      .subscribe(event => {
        const url = this.cleanUrl(event.urlAfterRedirects);

        if (this.isExcludedRoute(url)) {
          return;
        }

        clarity.setTag(
          'ruta',
          this.normalizeRoute(url)
        );
      });
  }

  /**
   * Determina si una ruta está excluida de Clarity.
   */
  private isExcludedRoute(url: string): boolean {
    return this.excludedPatterns.some(pattern =>
      pattern.test(url)
    );
  }

  /**
   * Limpia query params y normaliza la URL.
   */
  private cleanUrl(url: string): string {
    return url
      .toLowerCase()
      .split('?')[0]
      .split('#')[0];
  }

  /**
   * Normaliza rutas dinámicas.
   *
   * Ejemplo:
   * /erp/contabilidad/facturas/123
   *        ↓
   * /erp/contabilidad/facturas
   */
  private normalizeRoute(url: string): string {
    return url.replace(/\/\d+(\/[^/]+)?$/, '');
  }
}
