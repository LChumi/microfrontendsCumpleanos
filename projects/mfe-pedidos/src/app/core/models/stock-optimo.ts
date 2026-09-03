export interface StockOptimo {
  id:        ID;
  maximo:    number;
  minimo:    number;
  fechaIni?:  any;
  fechaFin?:  any;
  inactivo?:  boolean;
  mesIni?:    number;
  mesFin?:    number;
  bodega:    number;
  gondola:   number;
  producto:  number;
  usuario:   any;
}

export interface ID {
  codigo?:  any;
  empresa: any;
}
