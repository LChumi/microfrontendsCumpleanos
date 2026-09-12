import {Component, inject, output, signal} from '@angular/core';
import {UsuarioDTO} from '../../../../../core/dto/usuario.dto';
import {UsuarioService} from '../../../../../core/services/usuario.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-usuario-buscador',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './usuario-buscador.component.html',
  styles: ``
})
export class UsuarioBuscadorComponent {

  usuarioSeleccionado = output<UsuarioDTO>();

  private usuarioService = inject(UsuarioService);

  usrId = ''
  resultados = signal<UsuarioDTO[]>([]);

  buscar() {
    if (!this.usrId.trim()){
      this.resultados.set([]);
      return;
    }
    this.usuarioService.buscar(this.usrId).subscribe({
      next: (usuarios) => {
        this.resultados.set(usuarios);
      }
    });
  }

  seleccionar(usuario: UsuarioDTO) {
    this.usuarioSeleccionado.emit(usuario);
    this.resultados.set([]);
    this.usrId = usuario.usrId;
  }

}
