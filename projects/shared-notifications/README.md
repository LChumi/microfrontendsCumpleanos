# Shared Notifications

Librería compartida de Angular para centralizar componentes de **notificaciones Toast** y **diálogos de alerta** utilizados por los Micro Frontends (MFE).

Su objetivo es proporcionar una API común para mostrar mensajes y alertas, manteniendo un comportamiento y una experiencia visual consistente entre las diferentes aplicaciones.

## Características

* Toast notifications reutilizables.
* Alert Dialog reutilizable.
* API centralizada mediante `NotificationService`.
* Componentes standalone.
* Compatible con Angular 18.
* Diseñada para aplicaciones con arquitectura Micro Frontend.
* Configuración mediante interfaces TypeScript.
* Soporte para tipos de alerta: `success`, `warning`, `error` e `info`.
* Cierre automático de Toast.
* Cierre mediante teclado para Alert Dialog.

## API pública

La librería expone:

```ts
export * from './lib/shared-notifications.service';
export * from './lib/alert-dialog/alert-dialog.component';
export * from './lib/toast/toast.component';
```

Por lo tanto, los consumidores pueden utilizar:

* `NotificationService`
* `AlertDialogComponent`
* `ToastComponent`
* `AlertDialogType`
* `AlertDialogConfig`
* `ToastConfig`

## NotificationService

`NotificationService` permite comunicar las aplicaciones consumidoras con los componentes de notificación mediante observables.

```ts
import { NotificationService } from 'shared-notifications';

constructor(private readonly notificationService: NotificationService) {}
```

También puede utilizarse con `inject()`:

```ts
private readonly notificationService = inject(NotificationService);
```

### Mostrar un Alert Dialog

```ts
this.notificationService.showAlert({
  type: 'success',
  title: 'Operación completada',
  message: 'El producto fue guardado correctamente.',
  okLabel: 'Aceptar'
});
```

### Mostrar un Toast

```ts
this.notificationService.showToast({
  summary: 'Producto guardado',
  detail: 'El producto fue guardado correctamente.',
  autoCloseMs: 5000
});
```

## Alert Dialog

El componente `AlertDialogComponent` muestra un diálogo que requiere interacción del usuario.

### Configuración

```ts
export interface AlertDialogConfig {
  type?: AlertDialogType;
  title: string;
  message: string;
  okLabel?: string;
  closeOnEscape?: boolean;
}
```

### Tipos disponibles

```ts
export type AlertDialogType =
  'success' |
  'warning' |
  'error' |
  'info';
```

Ejemplo:

```ts
this.notificationService.showAlert({
  type: 'warning',
  title: 'Eliminar producto',
  message: '¿Está seguro de que desea eliminar este producto?',
  okLabel: 'Eliminar',
  closeOnEscape: true
});
```

### Comportamiento

El Alert Dialog permite:

* Cerrar mediante el botón configurado en `okLabel`.
* Cerrar mediante `Escape` cuando `closeOnEscape` está habilitado.
* Aceptar mediante `Enter`.
* Emitir el evento `accept`.
* Emitir cambios de visibilidad mediante `visibleChange`.

## Toast

El componente `ToastComponent` muestra mensajes breves que no requieren interacción del usuario.

### Configuración

```ts
export interface ToastConfig {
  summary: string;
  detail?: string;
  autoCloseMs?: number;
}
```

Ejemplo:

```ts
this.notificationService.showToast({
  summary: 'Guardado correctamente',
  detail: 'Los cambios fueron guardados.',
  autoCloseMs: 5000
});
```

### Cierre automático

El parámetro `autoCloseMs` permite definir el tiempo que permanecerá visible el Toast.

```ts
this.notificationService.showToast({
  summary: 'Operación completada',
  autoCloseMs: 3000
});
```

Si `autoCloseMs` no está definido, el Toast no se cierra automáticamente.

## Uso en un Micro Frontend

Los componentes de notificación pueden incluirse en el componente contenedor del MFE y escuchar los observables de `NotificationService`.

Ejemplo:

```ts
import { Component, inject } from '@angular/core';
import {
  AlertDialogComponent,
  NotificationService,
  ToastComponent
} from 'shared-notifications';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AlertDialogComponent,
    ToastComponent
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
  readonly notificationService = inject(NotificationService);

  alert$ = this.notificationService.alert$;
  toast$ = this.notificationService.toast$;
}
```

La plantilla puede consumir las configuraciones emitidas por el servicio:

```html
@if (alert$ | async; as alert) {
  <app-alert-dialog
    [visible]="true"
    [type]="alert.type ?? 'info'"
    [title]="alert.title"
    [message]="alert.message"
    [okLabel]="alert.okLabel ?? 'OK'"
    [closeOnEscape]="alert.closeOnEscape ?? true">
  </app-alert-dialog>
}

@if (toast$ | async; as toast) {
  <app-toast
    [visible]="true"
    [summary]="toast.summary"
    [detail]="toast.detail ?? ''"
    [autoCloseMs]="toast.autoCloseMs">
  </app-toast>
}
```

## ¿Cuándo utilizar cada componente?

### Toast

Utilizar Toast para mensajes que **no requieren una decisión del usuario**.

Ejemplos:

* Registro guardado correctamente.
* Producto actualizado.
* Error al cargar información.
* Advertencia informativa.
* Operación completada.

```ts
this.notificationService.showToast({
  summary: 'Producto actualizado',
  detail: 'Los cambios fueron guardados correctamente.',
  autoCloseMs: 4000
});
```

### Alert Dialog

Utilizar Alert Dialog cuando el usuario debe **interactuar o confirmar una acción**.

Ejemplos:

* Confirmar una eliminación.
* Informar de una acción importante.
* Confirmar una operación irreversible.

```ts
this.notificationService.showAlert({
  type: 'warning',
  title: 'Eliminar producto',
  message: '¿Está seguro de que desea eliminar este producto?',
  okLabel: 'Eliminar'
});
```

## Arquitectura

La librería actúa como una capa compartida entre los diferentes Micro Frontends:

```text
                    shared-notifications
                            │
             ┌──────────────┴──────────────┐
             │                             │
       NotificationService           UI Components
             │                       ┌─────┴─────┐
             │                       │           │
             │                     Toast      Alert Dialog
             │                       │           │
       ┌─────┼─────┬─────────────────┴───────────┘
       │     │     │
      MFE   MFE   MFE
       A     B     C
```

Los Micro Frontends utilizan `NotificationService` para emitir las notificaciones, mientras que los componentes visuales son responsables de representarlas.

Esto evita implementar diferentes versiones de Toast y Alert Dialog en cada MFE.

## Estructura

```text
projects/
└── shared-notifications/
    └── src/
        ├── lib/
        │   ├── alert-dialog/
        │   │   ├── alert-dialog.component.ts
        │   │   └── alert-dialog.component.html
        │   │
        │   ├── toast/
        │   │   ├── toast.component.ts
        │   │   └── toast.component.html
        │   │
        │   └── shared-notifications.service.ts
        │
        └── public-api.ts
```

## Desarrollo

Generar un nuevo componente:

```bash
ng generate component component-name --project shared-notifications
```

Generar un servicio:

```bash
ng generate service service-name --project shared-notifications
```

> Especificar siempre `--project shared-notifications` para generar el recurso dentro de esta librería.

## Build

Construir la librería:

```bash
ng build shared-notifications
```

Para mantener la compilación actualizada durante el desarrollo:

```bash
ng build shared-notifications --watch
```

Los artefactos se generan en:

```text
dist/shared-notifications/
```

## Tests

Ejecutar las pruebas unitarias:

```bash
ng test shared-notifications
```

## Publicación

Después de construir la librería:

```bash
ng build shared-notifications
```

Acceder al directorio generado:

```bash
cd dist/shared-notifications
```

Publicar el paquete:

```bash
npm publish
```

## Buenas prácticas

### Utilizar la API pública

Los consumidores deben importar desde el paquete:

```ts
import {
  NotificationService,
  AlertDialogComponent,
  ToastComponent
} from 'shared-notifications';
```

No se recomienda importar archivos internos:

```ts
// No recomendado
import { NotificationService } from 'shared-notifications/src/lib/shared-notifications.service';
```

### Mantener la responsabilidad de la librería

Esta librería debe concentrarse en:

* Notificaciones.
* Alertas.
* Diálogos.
* Comportamiento común relacionado con estas funcionalidades.

La lógica de negocio debe permanecer en cada Micro Frontend.

## Compatibilidad

| Tecnología   | Versión                            |
| ------------ | ---------------------------------- |
| Angular      | 18                                 |
| Arquitectura | Micro Frontend / Module Federation |

## Objetivo

`shared-notifications` proporciona una implementación común de Toast y Alert Dialog para todos los Micro Frontends.

Cualquier funcionalidad de notificación que deba ser reutilizada por múltiples MFE debe evaluarse para incorporarse a esta librería en lugar de duplicar su implementación.
