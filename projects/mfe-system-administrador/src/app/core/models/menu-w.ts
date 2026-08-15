import {ProgramaW} from './programa-w';
import {Seguridad} from './seguridad';

export interface MenuW {
  id?:        any;
  mnwId:     string;
  inactivo:  boolean;
  nombre:    string;
  icono:     string;
  reporta:   number | null;
  orden:     number;
  programa:  ProgramaW | null;
  seguridad: Seguridad;
}
