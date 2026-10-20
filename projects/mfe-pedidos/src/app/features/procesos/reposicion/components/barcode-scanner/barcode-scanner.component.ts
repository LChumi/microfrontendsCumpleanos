import {AfterViewInit, Component, ElementRef, inject, input, OnDestroy, output, signal, viewChild} from '@angular/core';
import {prepareZXingModule, readBarcodes} from 'zxing-wasm/reader';
import {environment} from '../../../../../../environments/environment';
import {NotificationService} from 'shared-notifications';

// Se ejecuta una sola vez, al importar este archivo
prepareZXingModule({
  overrides: {
    locateFile: (path: string, prefix: string) =>
      path.endsWith('.wasm') ? `${environment.mfeBaseUrl}/zxing_reader.wasm` : prefix + path,
  },
});

export function ean13Valido(c: string): boolean {
  if (!/^\d{13}$/.test(c)) return false;
  let s = 0;
  for (let i = 0; i < 12; i++) s += Number(c[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (s % 10)) % 10 === Number(c[12]);
}

const OPCIONES_ZXING = {
  formats: ['EAN-13'] as ['EAN-13'],
  tryHarder: true,
  tryRotate: true,
  tryInvert: true,
  tryDownscale: true,
  maxNumberOfSymbols: 1,
};

const INTERVALO_MS = 150;
const ERRORES_MAX = 5;

/**
 * Escaner de codigo de barras(EAN-13) con camara en vivo o foto
 */
@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [],
  templateUrl: './barcode-scanner.component.html',
  styles: ``
})
export class BarcodeScannerComponent implements AfterViewInit, OnDestroy{

  readonly validar = input<(codigo: string) => boolean>(ean13Valido);

  /** Emite el código leído y validado. El padre decide cuándo cerrarlo. */
  readonly detectado = output<string>();
  /** El usuario canceló, o la cámara no pudo abrirse. */
  readonly cerrar = output<void>();

  readonly procesandoFoto = signal(false);

  private readonly notif = inject(NotificationService);
  private readonly videoRef = viewChild.required<ElementRef<HTMLVideoElement>>('video');

  private stream?: MediaStream;
  private escaneoTimer: ReturnType<typeof setTimeout> | null = null;
  private escaneoActivo = false;
  private ultimoCodigo = '';
  private repeticiones = 0;
  private erroresSeguidos = 0;

  private readonly canvas = document.createElement('canvas');
  private readonly ctx = this.canvas.getContext('2d', {willReadFrequently: true})!;
  private detectorNativo?: { detect(src: ImageBitmapSource): Promise<{ rawValue: string }[]> };

  ngAfterViewInit() {
    void this.iniciar();
  }

  ngOnDestroy() {
    this.detener();
  }

  //Detector
  private async prepararDetector() {
    if (this.detectorNativo) return;

    const BD = (window as any).BarcodeDetector;
    if (!BD) return;

    try {
      const formatos: string[] = await BD.getSupportedFormats();
      if (formatos.includes('ean_13')) {
        this.detectorNativo = new BD({formats: ['ean_13']});
      }
    } catch (e) {
      console.warn('No se pudo iniciar el detector nativo', e);
    }
  }

  private async leerConZxing(img: ImageData): Promise<string | null> {
    const r = await readBarcodes(img, OPCIONES_ZXING);
    return r[0]?.isValid ? r[0].text : null;
  }

  private async detectar(video: HTMLVideoElement): Promise<string | null> {
    if (this.detectorNativo) {
      try {
        const r = await this.detectorNativo.detect(video);
        return r[0]?.rawValue ?? null;
      } catch (e) {
        console.warn('Detector nativo falló, paso a zxing', e);
        this.detectorNativo = undefined;
      }
    }

    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;
    this.ctx.drawImage(video, 0, 0);
    return this.leerConZxing(this.ctx.getImageData(0, 0, video.videoWidth, video.videoHeight));
  }

  //camara
  private async iniciar() {
    if (this.escaneoActivo) return;
    const video = this.videoRef().nativeElement;

    this.ultimoCodigo = '';
    this.repeticiones = 0;
    this.erroresSeguidos = 0;
    this.escaneoActivo = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {ideal: 'environment'},
          width: {ideal: 1920},
          height: {ideal: 1080},
        },
        audio: false,
      });

      // el componente pudo destruirse mientras se aceptaba el permiso
      if (!this.escaneoActivo) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      this.stream = stream;
      video.muted = true;               // iOS lo exige
      video.srcObject = stream;
      await video.play();

      // enfoque continuo si el equipo lo permite
      const track = stream.getVideoTracks()[0];
      const caps: any = track.getCapabilities?.() ?? {};
      if (caps.focusMode?.includes('continuous')) {
        await track.applyConstraints({advanced: [{focusMode: 'continuous'} as any]}).catch(() => {});
      }

      await this.prepararDetector();
      if (!this.escaneoActivo) return;

      await this.leerFrame(video);
    } catch (e) {
      console.error(e);
      this.detener();
      this.notif.showToast({
        type: 'warning',
        summary: 'Cámara',
        detail: 'No se pudo abrir la cámara. Revisa los permisos.',
        autoCloseMs: 3000,
      });
      this.cerrar.emit();
    }
  }

  private async leerFrame(video: HTMLVideoElement) {
    if (!this.escaneoActivo) return;

    try {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const texto = await this.detectar(video);
        this.erroresSeguidos = 0;
        if (texto && this.validar()(texto) && this.escaneoActivo && this.confirmar(texto)) {
          this.entregar(texto);
          return;
        }
      }
    } catch (e) {
      console.warn('Lectura fallida, sigo intentando', e);
      if (++this.erroresSeguidos >= ERRORES_MAX) {
        this.detener();
        this.notif.showToast({
          type: 'error',
          summary: 'Escáner',
          detail: 'No se pudo iniciar el lector de códigos',
          autoCloseMs: 3000,
        });
        this.cerrar.emit();
        return;
      }
    }

    this.escaneoTimer = setTimeout(() => void this.leerFrame(video), INTERVALO_MS);
  }

  private confirmar(texto: string): boolean {
    if (texto === this.ultimoCodigo) {
      this.repeticiones++;
    } else {
      this.ultimoCodigo = texto;
      this.repeticiones = 1;
    }
    return this.repeticiones >= 2;
  }

  private detener() {
    this.escaneoActivo = false;
    if (this.escaneoTimer) {
      clearTimeout(this.escaneoTimer);
      this.escaneoTimer = null;
    }
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = undefined;
  }

  private entregar(codigo: string) {
    this.detener();
    this.detectado.emit(codigo);
  }

  //Lectura desde foto
  abrirSelectorFoto() {
    this.detener();   // suelta la cámara en vivo

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');   // en PC se ignora

    input.onchange = () => {
      const file = input.files?.[0];
      if (file) void this.procesarFoto(file);
      else void this.iniciar();
    };
    // si el usuario cierra el selector sin elegir nada, vuelve la cámara en vivo
    input.addEventListener('cancel', () => void this.iniciar());

    input.click();   // debe ejecutarse dentro del clic del usuario, sin await antes
  }

  private async procesarFoto(file: File) {
    this.procesandoFoto.set(true);
    try {
      const texto = await this.leerArchivo(file);
      if (texto && this.validar()(texto)) {
        this.entregar(texto);
        return;
      }
      this.notif.showToast({
        type: 'warning',
        summary: 'Sin lectura',
        detail: 'No se detectó un código. Intenta otra foto, más cerca y enfocada.',
        autoCloseMs: 3500,
      });
    } catch (err) {
      console.error('Error leyendo foto', err);
      this.notif.showToast({
        type: 'error',
        summary: 'Error',
        detail: 'No se pudo procesar la foto',
        autoCloseMs: 3500,
      });
    } finally {
      this.procesandoFoto.set(false);
    }
    void this.iniciar();   // no hubo lectura: vuelve la cámara en vivo
  }

  private async leerArchivo(file: File): Promise<string | null> {
    await this.prepararDetector();

    // reduce la foto (12 MP+ es lento y no aporta); respeta la orientación EXIF
    const bmp = await createImageBitmap(file, {resizeWidth: 1920, resizeQuality: 'high'});
    try {
      if (this.detectorNativo) {
        try {
          const r = await this.detectorNativo.detect(bmp);
          if (r[0]?.rawValue) return r[0].rawValue;
        } catch { /* paso a zxing */ }
      }

      this.canvas.width = bmp.width;
      this.canvas.height = bmp.height;
      this.ctx.drawImage(bmp, 0, 0);
      return await this.leerConZxing(this.ctx.getImageData(0, 0, bmp.width, bmp.height));
    } finally {
      bmp.close();
    }
  }

}
