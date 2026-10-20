import {Gondola} from './gondola';

export interface Creposicion {
  id:           ID;
  almacenId:    number;
  bodegaId:     number;
  estado:       number;
  estadoGar:    number;
  fecha?:       any;
  finalizado:   number;
  gondolaId:    any;
  observacion:  string | null;
  tipo:         number;
  urgente:      number;
  usrLiquida?:  any;
  usuario:      string;
  gondola:      Gondola | null;
  bodegaFinId?: number;

  nombreBodega?:  string;
  bodSolicita?:   string;
}

export interface ID {
  codigo?:  any;
  empresa: number;
}
