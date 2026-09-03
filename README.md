# Microfrontends Cumpleaños

Aplicación frontend basada en una arquitectura de **Microfrontends (MFE)** utilizando **Angular 18** y **Webpack Module Federation**.

El proyecto está organizado en una aplicación **Shell (Host)** y múltiples aplicaciones **MFE (Remotes)**, permitiendo desarrollar, desplegar y mantener funcionalidades de forma independiente.

## Arquitectura

La aplicación utiliza el siguiente esquema:

```text
                         ┌─────────────────────┐
                         │       Shell         │
                         │       (Host)        │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
              ┌───────────┐   ┌───────────┐   ┌───────────┐
              │   mfe-*   │   │   mfe-*   │   │   mfe-*   │
              │  Remote   │   │  Remote   │   │  Remote   │
              └───────────┘   └───────────┘   └───────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
                           ┌─────────────────┐
                           │ Shared / Common │
                           │  Tailwind CSS   │
                           └─────────────────┘
```

### Proyectos

El workspace contiene diferentes proyectos Angular:

* **Shell**: aplicación principal que actúa como Host y carga los Microfrontends.
* **`mfe-*`**: aplicaciones remotas que contienen funcionalidades independientes.
* **Shared**: código y estilos compartidos entre los diferentes proyectos.

La comunicación y carga de los Microfrontends se realiza mediante **Module Federation**.

## Tecnologías

* **Angular 18**
* **TypeScript 5.5**
* **Module Federation**
* **Angular Architects Module Federation**
* **Docker**
* **Docker Compose**
* **Tailwind CSS 3**
* **PrimeNG** *(en proceso de migración/eliminación)*
* **RxJS**
* **Angular CDK**
* **Chart.js**
* **Microsoft Clarity**

## Estructura del proyecto

Una estructura aproximada del workspace es:

```text
microfrontends-cumpleanos/
│
├── projects/
│   ├── shell/
│   │   └── ...
│   │
│   ├── mfe-*/
│   │   └── ...
│   │
│   └── shared/
│       └── ...
│
├── docker/
│   └── ...
│
├── docker-compose.yml
├── angular.json
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

> Los nombres y cantidad de proyectos MFE pueden variar dependiendo de las funcionalidades implementadas.

## Requisitos

Antes de ejecutar el proyecto es necesario tener instalado:

* Node.js
* npm
* Docker
* Docker Compose

Se recomienda utilizar la versión de Node.js compatible con Angular 18.

Verificar las versiones instaladas:

```bash
node --version
npm --version
docker --version
docker compose version
```

## Instalación

Clonar el repositorio:

```bash
git clone <repository-url>
cd microfrontends-cumpleanos
```

Instalar las dependencias:

```bash
npm install
```

## Desarrollo local

### Ejecutar únicamente el proyecto actual

```bash
npm start
```

Por defecto, Angular iniciará el servidor de desarrollo en:

```text
http://localhost:4200
```

### Ejecutar Shell y todos los Microfrontends

El proyecto incluye el script:

```json
"run:all": "node node_modules/@angular-architects/module-federation/src/server/mf-dev-server.js"
```

Para ejecutar el entorno completo:

```bash
npm run run:all
```

Este comando permite levantar el Shell junto con los Microfrontends configurados mediante Module Federation.

## Module Federation

La comunicación entre el Shell y los Microfrontends se realiza mediante **Webpack Module Federation**.

El **Shell** funciona como Host y consume módulos expuestos por los proyectos remotos.

Conceptualmente:

```text
Shell
 │
 ├── carga mfe-usuarios
 ├── carga mfe-pedidos
 ├── carga mfe-reportes
 └── carga mfe-...
```

Cada MFE puede exponer componentes, módulos o funcionalidades que posteriormente son consumidos por el Shell.

La configuración de Module Federation se encuentra en los archivos correspondientes de cada proyecto.

## Docker

El proyecto está preparado para ejecutarse utilizando **Docker** y **Docker Compose**.

La ejecución mediante Docker permite levantar el entorno completo de Microfrontends utilizando una configuración común.

### Construir las imágenes

```bash
docker compose build
```

### Levantar la aplicación

```bash
docker compose up
```

Para ejecutar los contenedores en segundo plano:

```bash
docker compose up -d
```

### Detener la aplicación

```bash
docker compose down
```

### Reconstruir las imágenes

Cuando existen cambios en dependencias o configuración:

```bash
docker compose up --build
```

## Tailwind CSS

El proyecto utiliza **Tailwind CSS** como solución principal para los estilos.

La configuración de Tailwind se encuentra centralizada para facilitar el uso de estilos consistentes entre el Shell y los Microfrontends.

Los proyectos deben utilizar las clases de Tailwind en lugar de crear estilos específicos cuando exista una utilidad equivalente.

Ejemplo:

```html
<button class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
  Guardar
</button>
```

### Estilos compartidos

El proyecto cuenta con un módulo/proyecto compartido destinado a centralizar recursos comunes, incluyendo estilos y configuración relacionada con Tailwind.

Esto permite evitar duplicación de configuración entre los diferentes Microfrontends.

## PrimeNG

Actualmente el proyecto utiliza **PrimeNG** y **PrimeIcons** en algunas funcionalidades existentes.

Estas dependencias se mantienen temporalmente por compatibilidad con componentes existentes.

La intención es realizar una migración progresiva hacia componentes propios utilizando principalmente:

* Angular
* Tailwind CSS
* Angular CDK

Por lo tanto, para nuevas funcionalidades se recomienda priorizar **Tailwind + Angular/CDK** y evitar introducir nuevas dependencias de PrimeNG cuando no sea necesario.

## Scripts disponibles

| Script            | Descripción                                                   |
| ----------------- | ------------------------------------------------------------- |
| `npm start`       | Ejecuta el proyecto mediante Angular CLI                      |
| `npm run build`   | Genera el build de producción                                 |
| `npm run watch`   | Ejecuta el build en modo watch                                |
| `npm test`        | Ejecuta las pruebas unitarias                                 |
| `npm run run:all` | Ejecuta Shell y los Microfrontends mediante Module Federation |

## Build

Para generar los archivos de distribución:

```bash
npm run build
```

Los artefactos generados se encuentran normalmente en:

```text
dist/
```

Para construir una aplicación específica del workspace:

```bash
ng build <project-name>
```

## Pruebas unitarias

Las pruebas unitarias utilizan **Jasmine + Karma**.

Ejecutar:

```bash
npm test
```

## Desarrollo de nuevos Microfrontends

Para agregar un nuevo Microfrontend se debe:

1. Crear el proyecto Angular dentro de `projects/`.
2. Configurar Module Federation como aplicación **Remote**.
3. Definir los módulos/componentes que serán expuestos.
4. Registrar el Remote en el Shell.
5. Configurar los puertos correspondientes.
6. Agregar la aplicación al entorno Docker/Compose si corresponde.
7. Validar que los estilos compartidos funcionen correctamente.
8. Probar el MFE de forma independiente y posteriormente integrado con el Shell.

## Dependencias principales

```text
Angular 18
│
├── @angular-architects/module-federation
├── Tailwind CSS
├── Angular CDK
├── RxJS
├── Chart.js
└── PrimeNG (legacy / migración progresiva)
```

## Consideraciones de arquitectura

### Shell

El Shell debe encargarse principalmente de:

* Navegación principal.
* Layout global.
* Carga de Microfrontends.
* Configuración compartida.
* Elementos comunes de la aplicación.

La lógica específica de negocio debería mantenerse dentro del MFE correspondiente.

### Microfrontends

Cada MFE debe mantener su funcionalidad lo más aislada posible.

Se recomienda evitar dependencias innecesarias entre MFEs y utilizar los mecanismos definidos para compartir funcionalidades comunes.

### Código compartido

Los componentes, utilidades y estilos que sean realmente transversales deben mantenerse en el proyecto compartido.

No se recomienda colocar lógica específica de un MFE en `shared`.

## Flujo de desarrollo

```text
Desarrollador
     │
     ▼
Modifica MFE
     │
     ▼
Prueba MFE independientemente
     │
     ▼
Prueba integración con Shell
     │
     ▼
Docker Compose
     │
     ▼
Validación del entorno completo
```

## Producción

La aplicación está diseñada para desplegar los diferentes Microfrontends como aplicaciones independientes.

Cada MFE puede ser construido y empaquetado de forma independiente, mientras que el Shell actúa como punto de entrada de la aplicación.

La estrategia concreta de despliegue dependerá del entorno utilizado y de la infraestructura definida para el proyecto.

## Licencia

Proyecto bajo la licencia MIT.
