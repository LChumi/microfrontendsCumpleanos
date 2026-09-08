import {Seguridad} from './seguridad';

export interface RolW {
  id?:        any;
  rlwId:     string;
  nombre:    string;
  seguridad: Seguridad;
}
