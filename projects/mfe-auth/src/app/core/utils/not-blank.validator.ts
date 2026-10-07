import {AbstractControl, ValidationErrors} from '@angular/forms';

export function notBlank(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  return typeof v === 'string' && v.length > 0 && v.trim().length === 0
    ? { blank: true }
    : null;
}
