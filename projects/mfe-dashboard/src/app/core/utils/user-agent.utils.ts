import { SessionAccessDTO } from '../models/session-access.dto';

export type TipoDispositivo = 'Computador' | 'Móvil' | 'Tablet';

export interface UserAgentInfo {
  sistemaOperativo: string;
  arquitectura: string;
  navegador: string;
  versionNavegador: string;
  dispositivo: TipoDispositivo;
}

export interface AccesoView extends SessionAccessDTO {
  ua: UserAgentInfo;
  isActive: boolean;
  fecha: string;
  hora: string;
}

// El orden importa: iOS dice "like Mac OS X" y Android dice "Linux"
const SISTEMAS_OPERATIVOS: { nombre: string; regex: RegExp }[] = [
  { nombre: 'iOS', regex: /iPhone|iPad|iPod/ },
  { nombre: 'Android', regex: /Android/ },
  { nombre: 'Windows 10/11', regex: /Windows NT 10\.0/ },
  { nombre: 'Windows 8.1', regex: /Windows NT 6\.3/ },
  { nombre: 'Windows 8', regex: /Windows NT 6\.2/ },
  { nombre: 'Windows 7', regex: /Windows NT 6\.1/ },
  { nombre: 'ChromeOS', regex: /CrOS/ },
  { nombre: 'macOS', regex: /Macintosh|Mac OS X/ },
  { nombre: 'Linux', regex: /Linux|X11/ },
];

// El orden importa: Edge, Opera y Samsung también incluyen "Chrome"
const NAVEGADORES: { nombre: string; regex: RegExp }[] = [
  { nombre: 'Microsoft Edge', regex: /Edg(?:A|iOS|e)?\/([\d.]+)/ },
  { nombre: 'Opera', regex: /(?:OPR|OPiOS)\/([\d.]+)/ },
  { nombre: 'Samsung Internet', regex: /SamsungBrowser\/([\d.]+)/ },
  { nombre: 'Mozilla Firefox', regex: /(?:Firefox|FxiOS)\/([\d.]+)/ },
  { nombre: 'Google Chrome', regex: /(?:Chrome|CriOS)\/([\d.]+)/ },
  { nombre: 'Safari', regex: /Version\/([\d.]+).*Safari/ },
];

function detectarDispositivo(ua: string): TipoDispositivo {
  if (/iPad|Tablet/.test(ua)) return 'Tablet';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Móvil' : 'Tablet';
  if (/iPhone|iPod|Mobile/.test(ua)) return 'Móvil';
  return 'Computador';
}

function detectarArquitectura(ua: string): string {
  if (/Android|iPhone|iPad|iPod|Macintosh/.test(ua)) return '';
  if (/Win64|x64|WOW64|x86_64|aarch64|arm64/.test(ua)) return '64 bits';
  if (/Windows NT/.test(ua)) return '32 bits';
  return '';
}

export function parseUserAgent(userAgent: string | null | undefined): UserAgentInfo {
  const ua = userAgent ?? '';

  const sistemaOperativo =
    SISTEMAS_OPERATIVOS.find(s => s.regex.test(ua))?.nombre ?? 'Desconocido';

  let navegador = 'Desconocido';
  let versionNavegador = '';
  for (const nav of NAVEGADORES) {
    const match = ua.match(nav.regex);
    if (match) {
      navegador = nav.nombre;
      versionNavegador = match[1].split('.')[0]; // 154.0.0.0 -> 154
      break;
    }
  }

  return {
    sistemaOperativo,
    arquitectura: detectarArquitectura(ua),
    navegador,
    versionNavegador,
    dispositivo: detectarDispositivo(ua),
  };
}
