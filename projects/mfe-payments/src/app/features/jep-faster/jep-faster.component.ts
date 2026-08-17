import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {parameterIsNumeric} from '../../utils/params-utils';
import {JepFasterService} from '../../core/services/jep-faster.service';

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
    this.dialogType = 'success';
    this.dialogTitle = 'Confirmación';
    this.dialogMessage =
      'El pago fue realizado exitosamente. Por favor cierre la ventana.';

    this.showDialog = true;
  }

  private error(error: string, message: string): void {
    this.dialogType = 'warning';
    this.dialogTitle = 'Advertencia';
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
