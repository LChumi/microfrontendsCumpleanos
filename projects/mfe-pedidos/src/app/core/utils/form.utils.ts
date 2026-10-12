import {AbstractControl, ValidationErrors} from '@angular/forms';

export function minMaxValido(group: AbstractControl): ValidationErrors | null {
  const min = group.get('min')?.value;
  const max = group.get('max')?.value;
  if (min == null || max == null) return null;
  return Number(min) > Number(max) ? {rangoInvalido: true} : null;
}
