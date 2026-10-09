import {Component, inject} from '@angular/core';
import {SessionService} from '../../../../core/services/session.service';
import {SessionAccessDTO} from '../../../../core/models/session-access.dto';
import {getSessionItem} from '../../../../../../../mfe-pedidos/src/app/core/utils/storage.utils';
import {AccesoView, parseUserAgent} from '../../../../core/utils/user-agent.utils';

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

  accesos: AccesoView[] = [];

  ngOnInit(): void {
    this.sessionService.getUserAccesses(this.usuarioId).subscribe({
      next: value => this.setAccesos(value)
    });
  }

  private setAccesos(data: SessionAccessDTO[]) {
    this.accesos = data.map((acceso, index) => ({
      ...acceso,
      ua: parseUserAgent(acceso.userAgent),
      isActive: index === 0,
      fecha: this.formatFecha(acceso.loginTime),
      hora: this.formatHora(acceso.loginTime),
    }));
  }

  private formatFecha(fecha: string): string {
    const texto = new Date(fecha)
      .toLocaleDateString('es-EC', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      .replace(',', ''); // "jueves, 08 de..." -> "jueves 08 de..."
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  private formatHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected readonly parseUserAgent = parseUserAgent;
}
