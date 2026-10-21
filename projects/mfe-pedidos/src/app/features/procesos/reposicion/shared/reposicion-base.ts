import {computed, DestroyRef, Directive, ElementRef, inject, signal, viewChild, WritableSignal} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CreposicionService } from "../../../../core/services/creposicion.service";
import { DreposicionService } from "../../../../core/services/dreposicion.service";
import { NotificationService } from "shared-notifications";
import { getSessionItem } from "../../../../core/utils/storage.utils";
import { Creposicion } from "../../../../core/models/creposicion";
import { ProductoReposicionDto } from "../../../../core/dto/producto-reposicion.dto";
import {finalize, Observable } from "rxjs";
import { EnvioResultado } from "../../../../core/dto/envio-resultado";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {Dreposicion} from '../../../../core/models/dreposicion';
import {ProductoReposicionUpdateDto} from '../../../../core/dto/producto-reposicion-update.dto';
import {cargarImagenDefecto} from '../../../../core/utils/images.utils';
import {HttpErrorResponse} from '@angular/common/http';
import {BuscadorBarraComponent} from './buscador-barra/buscador-barra.component';

@Directive()
export abstract class ReposicionBase {

  // ── dependencias ──
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly destroyRef = inject(DestroyRef);
  protected readonly creposicionSvc = inject(CreposicionService);
  protected readonly dreposicionSvc = inject(DreposicionService);
  protected readonly notif = inject(NotificationService);

  protected readonly empresa = Number(getSessionItem('empresa'));
  protected readonly usuario = getSessionItem('username')!;
  readonly codigo = Number(this.route.snapshot.paramMap.get('id'));

  // ── refs ──
  readonly buscadorRef = viewChild(BuscadorBarraComponent);
  readonly cantidadRef = viewChild<ElementRef<HTMLInputElement>>('cantidadInput');

  // ── estado ──
  readonly pedido = signal<Creposicion | null>(null);
  readonly items = signal<ProductoReposicionDto[]>([]);
  readonly cargandoItems = signal(true);

  barraItem = signal('');
  readonly buscando = signal(false);
  readonly encontrados = signal<ProductoReposicionDto[]>([]);
  readonly producto = signal<ProductoReposicionDto | null>(null);

  readonly cantidad = signal(1);
  readonly observacion = signal('');
  readonly agregando = signal(false);

  readonly eliminandoId = signal<number | null>(null);
  readonly resaltadoId = signal<number | null>(null);
  private resaltadoTimer: ReturnType<typeof setTimeout> | null = null;

  readonly imagenAmpliada = signal<string | null>(null);
  readonly camaraAbierta = signal(false);

  subiendo = signal(false);
  readonly enviando = signal(false);
  readonly confirmandoEnvio = signal(false);

  // ── derivados ──
  readonly ocupado = computed(() =>
    this.enviando() || this.subiendo() || this.cargandoItems() || this.buscando() || this.agregando()
  );

  readonly yaEnPedido = computed(() => {
    const p = this.producto();
    return !!p && this.items().some(i => i.codigoProducto === p.codigoProducto);
  });

  readonly sinStockZh = computed(() => (this.producto()?.stockZh ?? 1) <= 0 && !!this.producto());

  readonly excedeStock = computed(() => {
    const p = this.producto();
    return !!p && this.cantidad() > (p.stockZh ?? 0);
  });

  readonly puedeAgregar = computed(() =>
    !!this.pedido() && !!this.producto() &&
    !this.yaEnPedido() && !this.sinStockZh() && !this.excedeStock() &&
    this.cantidad() > 0 && !this.ocupado()
  );

  readonly puedeEnviar = computed(() =>
    !!this.pedido() && this.items().length > 0 && !this.enviando() && !this.subiendo()
  );

  // ── puntos de extensión (lo que cambia entre componentes) ──
  protected abstract readonly textoEntidad: string;                 // 'la solicitud' | 'el pedido'
  protected abstract readonly rutaListado: string;
  protected abstract buscarProductos(dato: string): Observable<ProductoReposicionDto[]>;
  protected abstract puedeBuscar(): boolean;                        // valida bodegas necesarias
  protected abstract gondolaParaAgregar(): number | null;
  protected abstract enviar$(): Observable<EnvioResultado>;         // ver abajo
  protected onProductoSeleccionado(): void {}                       // hook opcional

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.resaltadoTimer) clearTimeout(this.resaltadoTimer);
    });
  }

  // ── ciclo de vida ──
  protected iniciar() {
    this.creposicionSvc.getPedido(this.codigo, this.empresa)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: p => this.pedido.set(p),
        error: e => this.fallo('No se pudo cargar la solicitud', e),
      });
    this.cargarItems();
  }

  cargarItems() {
    this.cargandoItems.set(true);
    this.dreposicionSvc.getProductsByCreposicion(this.codigo).pipe(
      finalize(() => this.cargandoItems.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: l => this.items.set([...l].sort((a, b) => b.id - a.id)),
      error: e => this.fallo('No se pudieron cargar los productos', e),
    });
  }

  // ── búsqueda ──
  mostrarProducto() {
    const dato = this.barraItem().trim().toUpperCase();
    if (!dato || !this.puedeBuscar() || this.ocupado()) return;

    this.limpiarBuscador();
    this.producto.set(null);
    this.encontrados.set([]);

    const existente = this.buscarEnItems(dato);
    if (existente) return this.avisarDuplicado(existente);

    this.buscando.set(true);
    this.buscarProductos(dato).pipe(
      finalize(() => this.buscando.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: lista => this.procesarResultados(lista),
      error: e => this.fallo('No se pudo buscar el producto', e),
    });
  }

  private procesarResultados(lista: ProductoReposicionDto[]) {
    if (lista.length === 0) {
      return this.aviso('Sin resultados', 'No se encontró el producto');
    }
    if (lista.length > 1) {
      return this.encontrados.set(lista);
    }
    const dup = this.items().find(i => i.codigoProducto === lista[0].codigoProducto);
    return dup ? this.avisarDuplicado(dup) : this.seleccionarProducto(lista[0]);
  }

  seleccionarProducto(p: ProductoReposicionDto) {
    this.producto.set(p);
    this.encontrados.set([]);
    this.cantidad.set(1);
    this.observacion.set('');
    this.onProductoSeleccionado();
    setTimeout(() => this.cantidadRef()?.nativeElement.select());
  }

  cancelarProducto() {
    this.producto.set(null);
    this.encontrados.set([]);
    this.enfocarBuscador();
  }

  // ── agregar / editar / eliminar ──
  agregar() {
    if (!this.puedeAgregar()) return;
    const p = this.producto()!;
    const cant = this.cantidad();
    this.agregando.set(true);

    const d: Dreposicion = {
      id: { empresa: this.empresa },
      creposicionId: this.codigo,
      productoId: p.id,
      cantSol: cant,
      cantApr: cant,
      observacion: this.observacion().trim(),
      gondolaId: this.gondolaParaAgregar(),
      precio: p.precio,
      usuario: this.usuario,
    };

    this.dreposicionSvc.addedProduct(d).pipe(
      finalize(() => this.agregando.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.producto.set(null);
        this.cargarItems();
        this.enfocarBuscador();
      },
      error: e => this.fallo('No se pudo agregar el producto', e),
    });
  }

  actualizarCanApr(p: ProductoReposicionDto, canApr: number) {
    const request: ProductoReposicionUpdateDto = {
      codigo: p.id, productoId: p.codigoProducto, cantidad: canApr, gondola: null,
    };
    this.dreposicionSvc.updateProdcut(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.items.update(l => l.map(i => i.id === p.id ? { ...i, canApr } : i)),
        error: e => {
          this.fallo('No se pudo actualizar la cantidad', e);
          this.cargarItems();
        },
      });
  }

  eliminar(id: number) {
    if (this.eliminandoId() !== null) return;
    this.eliminandoId.set(id);

    this.dreposicionSvc.deleteProductoReposicion(id, this.empresa).pipe(
      finalize(() => this.eliminandoId.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.items.update(l => l.filter(i => i.id !== id));
        this.aviso('Item eliminado', 'Producto eliminado de la lista', 3000);
      },
      error: e => this.fallo('No se pudo eliminar el item', e),
    });
  }

  // ── envío ──
  pedirConfirmacionEnvio() {
    if (this.puedeEnviar()) this.confirmandoEnvio.set(true);
  }

  cancelarEnvio() {
    this.confirmandoEnvio.set(false);
  }

  confirmarEnvio() {
    if (!this.puedeEnviar()) return;
    this.enviando.set(true);
    this.confirmandoEnvio.set(false);

    this.enviar$().pipe(
      finalize(() => this.enviando.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: r => {
        this.notif.showToast({
          type: r.tipo, summary: r.titulo, detail: r.detalle, autoCloseMs: 3000,
        });
        if (r.tipo === 'success') this.regresar();
      },
      error: e => this.fallo('No se pudo enviar', e),
    });
  }

  // ── escáner ──
  abrirCamara() { if (!this.ocupado()) this.camaraAbierta.set(true); }
  cerrarCamara() { this.camaraAbierta.set(false); }

  onCodigoEscaneado(codigo: string) {
    this.cerrarCamara();
    this.barraItem.set(codigo);
    this.mostrarProducto();
  }

  // ── navegación / excel ──
  regresar() { void this.router.navigate([this.rutaListado]); }
  readonly subirExcel = (file: File) => this.dreposicionSvc.uploadFile(file, this.codigo);

  // ── helpers de template ──
  onInput(sig: WritableSignal<string>, e: Event) {
    sig.set((e.target as HTMLInputElement).value);
  }
  onNumber(sig: WritableSignal<number>, e: Event) {
    const n = Math.floor(Number((e.target as HTMLInputElement).value));
    sig.set(Number.isFinite(n) ? n : 0);
  }
  onImgError(e: Event) { cargarImagenDefecto(e); }
  sinStock = (p: ProductoReposicionDto) => (p.stockZh ?? 0) <= 0;

  // ── helpers internos ──
  protected enfocarBuscador() {
    this.buscadorRef()?.enfocar();
  }

  private limpiarBuscador() {
    this.barraItem.set('');
    this.enfocarBuscador()
  }

  private buscarEnItems(dato: string) {
    return this.items().find(i =>
      i.barra?.toUpperCase() === dato || i.item?.toUpperCase() === dato
    );
  }

  private avisarDuplicado(item: ProductoReposicionDto) {
    this.subirAlInicio(item.id);
    this.aviso('Item ya agregado', `${item.item} ya está en ${this.textoEntidad}`);
  }

  private subirAlInicio(id: number) {
    this.items.update(l => {
      const idx = l.findIndex(i => i.id === id);
      if (idx <= 0) return l;
      const copia = [...l];
      const [mov] = copia.splice(idx, 1);
      return [mov, ...copia];
    });

    if (this.resaltadoTimer) clearTimeout(this.resaltadoTimer);
    this.resaltadoId.set(id);
    this.resaltadoTimer = setTimeout(() => this.resaltadoId.set(null), 3500);
  }

  // ── notificaciones ──
  protected aviso(summary: string, detail: string, autoCloseMs = 2500) {
    this.notif.showToast({ type: 'warning', summary, detail, autoCloseMs });
  }

  protected fallo(detail: string, err?: unknown) {
    if (err) console.error(err);
    const msg = err instanceof HttpErrorResponse ? err.error?.message : (err as Error)?.message;
    this.notif.showToast({
      type: 'error', summary: 'Error', detail: msg ?? detail, autoCloseMs: 4000,
    });
  }
}
