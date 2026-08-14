import {Usuario} from './usuario';
import {Programa} from './programa';

export interface UsuarioFavorito {
  codigo:   number;
  empresa:  number;
  usuario:  Usuario;
  programa: Programa;
}
