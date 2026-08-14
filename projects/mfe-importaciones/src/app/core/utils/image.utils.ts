import {environment} from '../../../environments/environment';

const imageUrl = `${environment.apiUrl}/assist/images/producto/`;

export function getUrlImage(proId: string): string {
  if (!proId) return `${imageUrl}/default`;
  return `${imageUrl}/${proId}`;
}
