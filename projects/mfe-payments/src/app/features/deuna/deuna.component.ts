import {Component, inject, OnInit} from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import {parameterIsNumeric} from '../../utils/params-utils';
import {DeunaService} from '../../core/services/deuna.service';
import {AlertDialogComponent} from '../../shared/components/alert-dialog/alert-dialog.component';
import {ToastComponent} from '../../shared/components/toast/toast.component';

@Component({
  selector: 'app-deuna',
  standalone: true,
  imports: [
    AlertDialogComponent,
    ToastComponent
  ],
  templateUrl: './deuna.component.html',
  styles: ``
})
export class DeunaComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly deunaService = inject(DeunaService);

  protected usrLiquida: any;
  protected empresa: any;
  protected imageBase64: string | null = null;

  protected showDialog = false;
  protected dialogTitle = '';
  protected dialogMessage = '';
  protected dialogType: 'success' | 'warning' = 'success';

  protected showToast = false;
  protected toastSummary = '';
  protected toastDetail = '';

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
    this.dialogType = 'success';
    this.dialogTitle = 'Confirmación';
    this.dialogMessage =
      'El pago fue realizado exitosamente. Por favor cierre la ventana.';

    this.showDialog = true;
  }

  private error(error: string, message: string): void {
    this.dialogType = 'warning';
    this.dialogTitle = 'Confirmación';
    this.dialogMessage = message;

    this.showDialog = true;

    this.toastSummary = error;
    this.toastDetail = 'Cierre la ventana por favor';
  }

  protected acceptDialog(): void {
    this.showDialog = false;

    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  protected closeDialog(): void {
    this.showDialog = false;
  }

  private cleanData(): void {
    this.imageBase64 = null;
    this.usrLiquida = null;
    this.empresa = null;
  }
}
