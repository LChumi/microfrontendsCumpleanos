import {environment} from '../../../environments/environment';

const imageUrl = `${environment.apiUrl}/assist/images/producto/`;

export function getUrlImage(proId: string): string {
  if (!proId) return `${imageUrl}/default`;
  return `${imageUrl}/${proId}`;
}

export function cargarImagenDefecto(event: Event){
  (event.target as HTMLImageElement).src = '/images/background/default.png';
}
