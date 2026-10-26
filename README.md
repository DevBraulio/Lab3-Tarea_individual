# Consulta del clima

Aplicación web que permite buscar una ciudad y consultar su temperatura, humedad y precipitación actuales con datos de Open-Meteo. No necesita una clave de API.

## Requisitos

- Node.js y pnpm instalados.
- Conexión a Internet.

## Instalación y ejecución

Desde la carpeta del repositorio:

```sh
cd implementacion
pnpm install --frozen-lockfile
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Uso

Escribe el nombre de una ciudad y pulsa **Buscar** o la tecla **Enter**. La aplicación mostrará la temperatura en °C, la humedad en % y la precipitación en mm.

Para detener el servidor, pulsa **Ctrl+C** en la terminal.

## Pruebas automatizadas

Las pruebas se encuentran en `implementacion/src/tests/` y utilizan Vitest, jsdom y fast-check. Antes de ejecutarlas, instala las dependencias con `pnpm install --frozen-lockfile` dentro de `implementacion/`.

Todos los comandos siguientes se ejecutan desde esa misma carpeta. No es necesario iniciar el servidor de la aplicación: las pruebas simulan las respuestas de la API.

### Ejecutar todas las pruebas

```sh
pnpm test
```

Ejecuta la suite una vez y muestra los archivos y casos aprobados o fallidos. Si una prueba falla, Vitest indica el caso y la comparación que no se cumplió.

### Repetir las pruebas al modificar archivos

```sh
pnpm test:watch
```

Mantiene Vitest activo y vuelve a ejecutar las pruebas cuando detecta cambios. Pulsa **q** o **Ctrl+C** para salir.

### Ejecutar un archivo de pruebas

Por ejemplo, para comprobar el servicio meteorológico:

```sh
pnpm test src/tests/weather.test.js
```

Puedes sustituir la ruta por cualquiera de los archivos de `src/tests/`.

### Generar el reporte de cobertura

```sh
pnpm test:coverage
```

Ejecuta las pruebas y muestra la cobertura de sentencias, ramas, funciones y líneas en la terminal. También genera un reporte HTML en `implementacion/coverage/index.html`, que puedes abrir directamente en el navegador.

Si tienes la aplicación en ejecución con `pnpm dev`, también puedes abrir [http://localhost:3000/coverage/index.html](http://localhost:3000/coverage/index.html). El reporte se actualiza cada vez que ejecutas `pnpm test:coverage`.
