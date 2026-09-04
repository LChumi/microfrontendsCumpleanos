import {Component, inject, OnInit} from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import {parameterIsNumeric} from '../../utils/params-utils';
import {DeunaService} from '../../core/services/deuna.service';
import {NotificationService} from 'shared-notifications';

@Component({
  selector: 'app-deuna',
  standalone: true,
  imports: [],
  templateUrl: './deuna.component.html',
  styles: ``
})
export class DeunaComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly deunaService = inject(DeunaService);
  private readonly notif = inject(NotificationService);

  protected usrLiquida: any;
  protected empresa: any;
  protected imageBase64: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.usrLiquida = params.get('id');
      this.empresa = params.get('empresa');

      if (!parameterIsNumeric(this.usrLiquida)) {
        return;
      }

      this.verificarPago();
    });
  }

  private verificarPago(): void {
    this.deunaService.verificarPago(this.usrLiquida!, this.empresa).subscribe({
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
    this.deunaService.generarPago(this.usrLiquida!, this.empresa).subscribe({
      next: data => {
        if (data.qr) {
          this.imageBase64 = data.qr;
          this.validarQr();
        }
      },
      error: err => {
        this.error(
          err.message,
          'Ocurrió un problema con el servicio DeUnaPagos.'
        );
      }
    });
  }

  private validarQr(): void {
    this.deunaService.validarPago(
      this.usrLiquida!,
      this.empresa
    ).subscribe({
      next: data => {
        if (/APPROVED/.test(data.status)) {
          this.confirm();
          this.cleanData();
        }
      },
      error: error => {
        this.error(
          error.message,
          'Tiempo de espera agotado'
        );

        this.cleanData();
      }
    });
  }

  private confirm(): void {
    this.notif.showAlert({
      type: 'success',
      title: 'Confirmación',
      message: '¡Pago con DeUna realizado con éxito! Cierre la ventana para continuar.'
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
