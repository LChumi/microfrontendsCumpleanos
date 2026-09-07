import {SessionAccessDTO} from '../models/session-access.dto';

export interface UserAgentInfo {
  sistemaOperativo: string;
  arquitectura: string;
  navegador: string;
  versionNavegador: string;
  dispositivo: string;
}

export interface AccesoView extends SessionAccessDTO  {
  ua: UserAgentInfo;
  isActive: boolean;
}

export function parseUserAgent(userAgent: string): UserAgentInfo {
  let sistemaOperativo = 'Desconocido';
  let arquitectura = '';
  let navegador = 'Desconocido';
  let versionNavegador = '';
  let dispositivo = 'Computador';

  // Sistema operativo
  if (/Windows NT 10\.0/i.test(userAgent)) {
    sistemaOperativo = 'Windows 10';
  } else if (/Windows NT 6\.3/i.test(userAgent)) {
    sistemaOperativo = 'Windows 8.1';
  } else if (/Windows NT 6\.2/i.test(userAgent)) {
    sistemaOperativo = 'Windows 8';
  } else if (/Windows NT 6\.1/i.test(userAgent)) {
    sistemaOperativo = 'Windows 7';
  } else if (/Mac OS X/i.test(userAgent)) {
    sistemaOperativo = 'macOS';
  } else if (/Android/i.test(userAgent)) {
    sistemaOperativo = 'Android';
    dispositivo = 'Móvil';
  } else if (/iPhone|iPad/i.test(userAgent)) {
    sistemaOperativo = 'iOS';
    dispositivo = /iPad/i.test(userAgent) ? 'Tablet' : 'Móvil';
  } else if (/Linux/i.test(userAgent)) {
    sistemaOperativo = 'Linux';
  }

  // Arquitectura
  if (/Win64|x64|WOW64/i.test(userAgent)) {
    arquitectura = '64 bits';
  } else if (/Windows NT/i.test(userAgent)) {
    arquitectura = '32 bits';
  }

  // Navegador (el orden importa: Edge y Opera también incluyen "Chrome")
  if (/Edg\/([\d.]+)/i.test(userAgent)) {
    navegador = 'Microsoft Edge';
    versionNavegador = userAgent.match(/Edg\/([\d.]+)/i)?.[1] ?? '';
  } else if (/OPR\/([\d.]+)/i.test(userAgent)) {
    navegador = 'Opera';
    versionNavegador = userAgent.match(/OPR\/([\d.]+)/i)?.[1] ?? '';
  } else if (/Chrome\/([\d.]+)/i.test(userAgent)) {
    navegador = 'Google Chrome';
    versionNavegador = userAgent.match(/Chrome\/([\d.]+)/i)?.[1] ?? '';
  } else if (/Firefox\/([\d.]+)/i.test(userAgent)) {
    navegador = 'Mozilla Firefox';
    versionNavegador = userAgent.match(/Firefox\/([\d.]+)/i)?.[1] ?? '';
  } else if (/Version\/([\d.]+).*Safari/i.test(userAgent)) {
    navegador = 'Safari';
    versionNavegador = userAgent.match(/Version\/([\d.]+).*Safari/i)?.[1] ?? '';
  }

  // Solo mostramos la versión mayor (152.0.0.0 -> 152)
  versionNavegador = versionNavegador.split('.')[0];

  return { sistemaOperativo, arquitectura, navegador, versionNavegador, dispositivo };
}
