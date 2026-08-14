import {Component, EventEmitter, inject, input, Input, OnInit, Output} from '@angular/core';
import {SeleccionService} from '../../../core/services/seleccion.service';
import {ClienteService} from '../../../core/services/cliente.service';
import {SelectItem} from 'primeng/api';
import {Cliente} from '../../../core/models/cliente';
import {getSessionItem} from '../../../core/utils/storage.utils';
import {Table, TableModule} from 'primeng/table';
import {DialogModule} from 'primeng/dialog';
import {ToolbarModule} from 'primeng/toolbar';
import {DropdownModule} from 'primeng/dropdown';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonDirective} from 'primeng/button';
import {Ripple} from 'primeng/ripple';

@Component({
  selector: 'app-modal-cliente',
  standalone: true,
  imports: [
    DialogModule,
    ToolbarModule,
    DropdownModule,
    TableModule,
    InputTextModule,
    ButtonDirective,
    Ripple
  ],
  templateUrl: './modal-cliente.component.html',
  styles: ``
})
export class ModalClienteComponent implements OnInit {

  public tipoCliente = input.required<string>();
  private _visible = false;
  @Input() isVisibleDropdown: boolean = false
  @Output() onBtnClick: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onChangeProv: EventEmitter<string> = new EventEmitter<string>();
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() set visible(val: boolean) {
    this._visible = val;
  }

  get visible(): boolean {
    return this._visible;
  }


  protected loading = false;

  sortTipoCli: SelectItem[] = []
  clientes: Cliente[] = []
  selectedClient!: Cliente

  private selectionService = inject(SeleccionService)
  private clienteService = inject(ClienteService)

  protected empresa = 0;

  constructor() {
  }

  ngOnInit() {
    this.sortTipoCli = [
      {label: 'Cliente', value: 1},
      {label: 'Proveedor', value: 2},
      {label: 'Empleado', value: 5},
    ]
    this.empresa = Number(getSessionItem("empresa"));
    this.listarClientes(this.empresa, 2);
  }

  onSortChange(event: any) {
    const tipo = Number(event.value);
    this.listarClientes(this.empresa, tipo)
  }

  listarClientes(empresa: number, tipo: number) {
    this.loading = true;
    this.clienteService.getClienteXTipo(empresa, tipo).subscribe({
      next: data => {
        this.clientes = data
        this.loading = false
      },
      error: err => {
        console.error(err)
        this.clientes = []
        this.loading = false
      }
    })
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  seleccionarProv(proveedor: Cliente) {
    this.selectionService.actualizarClienteSeleccionado(proveedor.codigo)
    this.onChangeProv.emit(proveedor.nombre)
    this.onBtnClick.emit(false)
    this.visible = false
  }

  close(){
    this.visible = false
    this.visibleChange.emit(false)
  }

}
