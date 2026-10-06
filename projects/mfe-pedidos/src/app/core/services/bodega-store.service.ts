import {inject, Injectable, signal} from '@angular/core';
import {BodegaWebVService} from './bodega-web-v.service';
import {BodegaWebV} from '../dto/bodega-web-v';
import {getSessionItem} from '../utils/storage.utils';

@Injectable({
  providedIn: 'root'
})
export class BodegaStoreService {
  private readonly bodegaService = inject(BodegaWebVService);

  private readonly _bodegas = signal<BodegaWebV[]>([]);
  readonly bodegas = this._bodegas.asReadonly();

  private cargando = false;
  private cargado = false;

  cargar(): void {
    if (this.cargado || this.cargando) return;

    const usrId = getSessionItem('usrId');
    const empresa = getSessionItem('empresa');
    if (!usrId || !empresa) return;

    this.cargando = true;
    this.bodegaService.listarBodegas(Number(usrId), Number(empresa)).subscribe({
      next: value => {
        this._bodegas.set(value);
        this.cargado = true;
        this.cargando = false;
      },
      error: err => {
        console.error('Error al obtener las bodegas', err);
        this.cargando = false; // permite reintentar en la próxima llamada
      }
    });
  }

  limpiar(): void {
    this._bodegas.set([]);
    this.cargado = false;
    this.cargando = false;
  }
}
