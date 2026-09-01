import {Gondola} from './gondola';

export interface Creposicion {
  id:          ID;
  almacenId:   number;
  bodegaId:    number;
  estado:      number;
  estadoGar:   number;
  fecha:       any;
  finalizado:  number;
  gondolaId:   any;
  observacion: string;
  tipo:        number;
  urgente:     number;
  usrLiquida:  any;
  usuario:     string;
  gondola:     Gondola;
}

export interface ID {
  codigo:  number;
  empresa: number;
}
