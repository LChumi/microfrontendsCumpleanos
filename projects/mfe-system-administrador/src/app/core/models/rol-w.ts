import {Seguridad} from './seguridad';

export interface RolW {
  id:        number;
  rlwId:     string;
  nombre:    string;
  seguridad: Seguridad;
}
