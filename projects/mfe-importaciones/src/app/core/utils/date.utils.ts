import {formatDate} from '@angular/common';

export function getDateFormattedNow() {
  const date = new Date();
  return formatDate(date, 'dd-MM-YYYY', 'en-US');
}

export function getCurrentDateNow(): string {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = (fecha.getMonth() + 1).toString().padStart(2, '0'); // Mes con 2 dígitos
  const day = fecha.getDate().toString().padStart(2, '0'); // Día con 2 dígitos
  return `${year}-${month}-${day}`;
}
