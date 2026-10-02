import {Gondola} from './gondola';
import {Creposicion} from './creposicion';

export interface Dreposicion {
  id:            ID;
  cantSol:       number;
  cantApr:       number;
  observacion:   string;
  usuario:       string;
  precio:        number;
  porcDesc:      number;
  valDesc:       number;
  total:         number;
  cantDisp:      number;
  productoId:    number;
  gondolaId:     number;
  creposicionId: number;
  creposicion:   Creposicion;
  drpGondola:    Gondola;
}

export interface ID {
  codigo:   number;
  empresa:  number;
}
