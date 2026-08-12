import {ClienteDto} from './cliente.dto';
import {DfacturaDto} from './dfactura.dto';

export interface CompraDetalleProductoDto {
  cco:         number;
  almacen:     string;
  almacenId:   string;
  fecha:       Date;
  sigla:       string;
  documento:   string;
  concepto:    string;
  comprobante: string;
  cliente:     ClienteDto;
  items:       DfacturaDto[];
}
