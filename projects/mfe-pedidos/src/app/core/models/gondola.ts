export interface Gondola {
  id:         ID;
  bodega:     number;
  creaFecha:  Date;
  creaUsr:    string;
  gonGeneral: boolean;
  gonId:      string;
  gonUsuario: number;
  inactivo:   boolean;
  modFecha:   Date;
  modUsr:     string;
  nombre:     string;
  seccion:    null;
}

export interface ID {
  codigo:  number;
  empresa: number;
}
