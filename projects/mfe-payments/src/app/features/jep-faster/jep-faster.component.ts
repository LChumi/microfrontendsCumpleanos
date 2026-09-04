import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {parameterIsNumeric} from '../../utils/params-utils';
import {JepFasterService} from '../../core/services/jep-faster.service';
import {NotificationService} from 'shared-notifications';

@Component({
  selector: 'app-jep-faster',
  standalone: true,
  imports: [],
  templateUrl: './jep-faster.component.html',
  styles: ``
})
export class JepFasterComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly jepService = inject(JepFasterService);
  private readonly notif = inject(NotificationService);

  protected usrLiquida: any;
  protected empresa: any;

  protected imageBase64: string | null = null;

  private static readonly base64 = 'data:image/png;base64,';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.usrLiquida = params.get('id');
      this.empresa = params.get('empresa');

      if (!parameterIsNumeric(this.usrLiquida)) {
        return;
      }

      this.verificarPagoJep();
    });
  }

  private verificarPagoJep(): void {
    this.jepService.verificarPago(this.usrLiquida!, this.empresa).subscribe({
      next: data => {
        if (data.success) {
          this.confirm();
        } else {
          this.obtenerQr();
        }
      },
      error: err => {
        this.error(err.message, err.message);
      }
    });
  }

  private obtenerQr(): void {
    this.jepService.generarQr(this.usrLiquida!, this.empresa).subscribe({
      next: data => {
        if (data.data?.qr) {
          this.imageBase64 = JepFasterComponent.base64 + data.data.qr;
          this.validarQr();
        }
      },
      error: err => {
        this.error(
          err.message,
          'Ocurrió un problema con el servicio JepFaster.'
        );
      }
    });
  }

  private validarQr(): void {
    this.jepService.validarPago(this.usrLiquida!, this.empresa).subscribe({
      next: data => {
        if (data.success) {
          this.confirm();
          this.cleanData();
        }
      },
      error: err => {
        this.error(err.message, 'Tiempo de espera agotado');
        this.cleanData();
      }
    });
  }

  private confirm(): void {
    this.notif.showAlert({
      type: 'success',
      title: 'Confirmación',
      message: '¡Pago con JepFaster realizado con éxito! Cierre la ventana para continuar.'
    });
  }

  private error(error: string, message: string): void {
    this.notif.showAlert({
      type: 'warning',
      title: 'Advertencia',
      message: message
    });

    this.notif.showToast({
      type: 'error',
      summary: message,
      detail: error,
      autoCloseMs: 10000
    })
  }

  private cleanData(): void {
    this.imageBase64 = null;
    this.usrLiquida = null;
    this.empresa = null;
  }
}
