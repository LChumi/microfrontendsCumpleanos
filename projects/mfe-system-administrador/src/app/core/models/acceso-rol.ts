import {RolW} from './rol-w';
import {Sistema} from './sistema';

export interface AccesoRol {
  id?:     number;
  empresa: number;
  almacen: number;
  usuario: number;
  orden:   number;
  rolW:    RolW;
  sistema?: Sistema;
}
