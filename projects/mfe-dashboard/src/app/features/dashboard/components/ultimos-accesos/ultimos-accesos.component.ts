import {Component, inject} from '@angular/core';
import {SessionService} from '../../../../core/services/session.service';
import {SessionAccessDTO} from '../../../../core/models/session-access.dto';
import {getSessionItem} from '../../../../../../../mfe-pedidos/src/app/core/utils/storage.utils';

@Component({
  selector: 'app-ultimos-accesos',
  standalone: true,
  imports: [],
  templateUrl: './ultimos-accesos.component.html',
  styles: ``
})
export class UltimosAccesosComponent {

  private readonly sessionService = inject(SessionService);
  private readonly usuarioId = getSessionItem("username")!;

  accesos: SessionAccessDTO[] = [];

  ngOnInit(): void {
    this.sessionService.getUserAccesses(this.usuarioId).subscribe({
      next: value => this.accesos = value
    });
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

}
