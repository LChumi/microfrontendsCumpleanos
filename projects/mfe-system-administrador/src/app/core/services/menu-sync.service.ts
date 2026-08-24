import { Injectable } from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuSyncService {

  private programaCreado$ = new Subject<void>()
  private menuCreado$ = new Subject<void>()
  private rolCreado$ = new Subject<void>()

  progrmamCreado = this.programaCreado$.asObservable()
  menuCreado = this.menuCreado$.asObservable()
  rolCreado = this.rolCreado$.asObservable()

  notificarProgramaCreado() {
    this.programaCreado$.next()
  }

  notificarMenuCreado() {
    this.menuCreado$.next()
  }

  notificarRolCreado() {
    this.rolCreado$.next()
  }
}
