# Implementation Plan: Weather Forecast App

## Overview

Implementación de una SPA frontend pura (HTML + CSS + JavaScript vanilla) que permite consultar el pronóstico meteorológico de cualquier ciudad del mundo usando las APIs públicas de Open-Meteo. La implementación sigue una arquitectura de tres capas: API Service, State Manager y UI Layer, con property-based testing mediante Vitest + fast-check.

## Tasks

- [ ] 1. Set up project structure, tooling and core types
  - Create the directory structure: `src/api/`, `src/state/`, `src/ui/`, `src/tests/`
  - Create `index.html` with the root markup: `SearchForm`, placeholder divs for `LoadingIndicator`, `ForecastDisplay` and `ErrorDisplay`
  - Create `src/types.js` (JSDoc) with `AppState`, `WeatherResult`, `GeocodingResult` and `AppError` type definitions
  - Initialize `package.json` with `vitest` and `fast-check` as dev dependencies; create `vitest.config.js` with `globals: true`
  - _Requirements: 1.1, 4.6_

- [ ] 2. Implement the Geocoding API service
  - [ ] 2.1 Implement `geocodeCity(cityName)` in `src/api/geocoding.js`
    - Build the URL with `name=cityName.trim()`, `count=1`, `language=en`, `format=json`
    - Map all error cases: network error → `geocoding_unavailable`; missing/null `results` → `unexpected_geocoding_response`; empty `results` → `city_not_found`
    - Return a `GeocodingResult` with `{ latitude, longitude, name }` from `results[0]`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1_

  - [ ]* 2.2 Write property test for geocodeCity — Property 2: Trim del input
    - **Property 2: Trim del input antes de llamar a la API**
    - **Validates: Requirements 1.4, 2.1**

  - [ ]* 2.3 Write property test for geocodeCity — Property 3: Parámetros correctos en la petición
    - **Property 3: Petición a Geocoding_API con parámetros correctos**
    - **Validates: Requirements 2.1, 2.5**

  - [ ]* 2.4 Write unit tests for `geocoding.js`
    - Test: respuesta exitosa extrae `latitude`, `longitude` y `name` de `results[0]`
    - Test: `results` vacío lanza `city_not_found`
    - Test: `results` nulo lanza `unexpected_geocoding_response`
    - Test: error de red lanza `geocoding_unavailable`
    - _Requirements: 2.3, 2.4, 5.1_

- [ ] 3. Implement the Weather API service
  - [ ] 3.1 Implement `fetchWeather(lat, lon)` in `src/api/weather.js`
    - Build the URL with `latitude`, `longitude`, `current=temperature_2m,relative_humidity_2m,precipitation`
    - Implement `AbortController` timeout of 10 seconds; on `AbortError` throw `weather_timeout`
    - Map all error cases: network error → `weather_unavailable`; HTTP 4xx/5xx → `weather_unavailable`; missing/null `current` → `unexpected_weather_response`
    - Return a `WeatherResult` extracting `temperature_2m`, `relative_humidity_2m`, `precipitation` (use `null` for missing fields)
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 5.2_

  - [ ]* 3.2 Write property test for fetchWeather — Property 4: Coordenadas reenviadas a Weather_API
    - **Property 4: Coordenadas del primer resultado se reenvían a la Weather_API**
    - **Validates: Requirements 2.2**

  - [ ]* 3.3 Write property test for fetchWeather — Property 5: Variables requeridas en la petición
    - **Property 5: Petición a Weather_API incluye las variables requeridas**
    - **Validates: Requirements 3.1**

  - [ ]* 3.4 Write property test for fetchWeather — Property 6: Extracción de datos desde la respuesta
    - **Property 6: Extracción de datos desde la respuesta de la Weather_API**
    - **Validates: Requirements 3.2, 4.5**

  - [ ]* 3.5 Write unit tests for `weather.js`
    - Test: respuesta exitosa mapea los tres campos correctamente
    - Test: campo `current` nulo lanza `unexpected_weather_response`
    - Test: timeout de 10 s lanza `weather_timeout`
    - Test: error de red lanza `weather_unavailable`
    - Test: HTTP 500 lanza `weather_unavailable`
    - _Requirements: 3.2, 3.4, 3.5, 3.6, 5.2_

- [ ] 4. Checkpoint — Ensure all API service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement the State Manager
  - [ ] 5.1 Implement `src/state/store.js` with centralized state and transition functions
    - Define initial `AppState` as `{ status: 'idle' }`
    - Expose `dispatch(action)` that transitions state: `SEARCH_START` → `loading`; `SEARCH_SUCCESS` → `success`; `SEARCH_ERROR` → `error`; `INPUT_EMPTY` → `error` with `empty_input`
    - On `SEARCH_START`, synchronously clear any previous result or error before async calls begin
    - Notify a registered `renderCallback` after each state transition
    - _Requirements: 4.7, 5.3, 5.4_

  - [ ] 5.2 Implement `src/state/actions.js` — `searchCity(cityName)` orchestrator
    - Trim input; if empty dispatch `INPUT_EMPTY` and return without calling the Geocoding_API
    - Dispatch `SEARCH_START`, call `geocodeCity`, then call `fetchWeather` with the returned coordinates
    - On success dispatch `SEARCH_SUCCESS` with the `WeatherResult`; on any thrown `AppError` dispatch `SEARCH_ERROR`
    - _Requirements: 1.3, 1.4, 2.1, 2.2, 2.6_

  - [ ]* 5.3 Write property test for State Manager — Property 1: Whitespace input always produces validation error
    - **Property 1: Entrada con solo espacios en blanco siempre produce error de validación**
    - **Validates: Requirements 1.3, 1.4, 2.6**

  - [ ]* 5.4 Write property test for State Manager — Property 9: Nueva búsqueda limpia el estado previo
    - **Property 9: Nueva búsqueda limpia el estado previo antes de mostrar la carga**
    - **Validates: Requirements 4.7**

  - [ ]* 5.5 Write unit tests for `store.js` and `actions.js`
    - Test: estado inicial es `idle`
    - Test: `SEARCH_START` transiciona a `loading` limpiando resultado o error previo
    - Test: `SEARCH_SUCCESS` transiciona a `success` con los datos correctos
    - Test: `SEARCH_ERROR` transiciona a `error` con el mensaje correcto
    - Test: input vacío no llama a `geocodeCity`
    - _Requirements: 1.3, 1.4, 4.7, 5.3, 5.4_

- [ ] 6. Implement UI formatters
  - [ ] 6.1 Implement `src/ui/formatters.js` — pure formatting functions
    - `formatTemperature(value)`: returns `"N/A"` for `null`, otherwise `value.toFixed(1) + "°C"`
    - `formatHumidity(value)`: returns `"N/A"` for `null`, otherwise `Math.round(value) + "%"`
    - `formatPrecipitation(value)`: returns `"N/A"` for `null`, otherwise `value.toFixed(1) + " mm"`
    - `getErrorMessage(appError)`: maps every `AppError.kind` to its Spanish user-facing string
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [ ]* 6.2 Write property test for formatters — Property 7: Renderizado correcto de los datos meteorológicos
    - **Property 7: Renderizado correcto de los datos meteorológicos**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

  - [ ]* 6.3 Write unit tests for `formatters.js`
    - Test: `formatTemperature(null)` → `"N/A"`; `formatTemperature(12.345)` → `"12.3°C"`
    - Test: `formatHumidity(null)` → `"N/A"`; `formatHumidity(65.7)` → `"66%"`
    - Test: `formatPrecipitation(null)` → `"N/A"`; `formatPrecipitation(0)` → `"0.0 mm"`
    - Test: `getErrorMessage` cubre todos los `AppError.kind`
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 7. Implement UI components and render logic
  - [ ] 7.1 Implement `src/ui/components.js` — DOM rendering functions
    - `renderLoading(visible)`: shows/hides `LoadingIndicator` (min 24×24 px spinner); only visible when `status === 'loading'`
    - `renderForecast(weatherResult)`: populates `ForecastDisplay` with city name, formatted temperature, humidity and precipitation; hides `ErrorDisplay`
    - `renderError(message)`: populates `ErrorDisplay` with the error message; hides `ForecastDisplay`; re-enables and focuses `City_Input`
    - `renderIdle()`: hides both `ForecastDisplay` and `ErrorDisplay`
    - _Requirements: 1.1, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.3, 5.4, 5.5_

  - [ ] 7.2 Implement `src/ui/render.js` — main render dispatcher
    - Implement `render(appState)` that switches on `appState.status` and calls the appropriate component function
    - Wire `render` as the `renderCallback` of the State Manager
    - _Requirements: 5.3, 5.4_

  - [ ]* 7.3 Write property test for UI components — Property 8: Exclusividad mutua entre ForecastDisplay y ErrorDisplay
    - **Property 8: Exclusividad mutua entre ForecastDisplay y ErrorDisplay**
    - **Validates: Requirements 5.3, 5.4**

  - [ ]* 7.4 Write property test for UI components — Property 10: City_Input permanece habilitado tras cualquier error
    - **Property 10: El City_Input permanece habilitado tras cualquier error**
    - **Validates: Requirements 5.5**

  - [ ]* 7.5 Write unit tests for `components.js` and `render.js`
    - Test: `renderForecast` muestra ciudad y oculta `ErrorDisplay`
    - Test: `renderError` muestra mensaje, oculta `ForecastDisplay`, enfoca `City_Input`
    - Test: `renderLoading(true)` muestra el spinner; `renderLoading(false)` lo oculta
    - Test: `render` con estado `idle` oculta ambos paneles
    - _Requirements: 3.3, 4.1, 4.6, 5.3, 5.4, 5.5_

- [ ] 8. Implement SearchForm event wiring and main entry point
  - [ ] 8.1 Implement `src/ui/searchForm.js` — form event handlers
    - Attach `submit` handler on the form that calls `searchCity(City_Input.value)`
    - Attach `keydown` handler on `City_Input` that triggers `submit` on Enter key
    - _Requirements: 1.2, 1.5_

  - [ ] 8.2 Implement `src/main.js` — application bootstrap
    - Initialize State Manager with `render` as callback
    - Import and wire `SearchForm` event handlers
    - Call `renderIdle()` on load to set initial visible state
    - _Requirements: 1.1_

  - [ ]* 8.3 Write unit test for SearchForm event wiring
    - Test: tecla Enter en `City_Input` dispara la búsqueda con el valor del input
    - Test: click en botón de búsqueda dispara la búsqueda
    - _Requirements: 1.5_

- [ ] 9. Add base CSS styling
  - [ ] 9.1 Implement `src/styles.css` — layout and component styles
    - Center the app in the viewport; style `SearchForm` con input y botón en fila
    - Style `LoadingIndicator` con dimensiones mínimas de 24×24 px y animación de spinner
    - Style `ForecastDisplay` como tarjeta con ciudad, temperatura, humedad y precipitaciones
    - Style `ErrorDisplay` con color de error distinguible
    - _Requirements: 1.1, 4.6_

- [ ] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los property tests usan `fast-check` con `numRuns: 100` como mínimo
- Los tests unitarios usan `vitest` con `globals: true`
- Los property tests de la capa de API requieren mockear `fetch` globalmente en el entorno de test
- La cobertura mínima esperada está detallada en la sección Testing Strategy del diseño

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "5.1", "6.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2", "3.3", "3.4", "3.5", "5.2", "6.2", "6.3"] },
    { "id": 3, "tasks": ["5.3", "5.4", "5.5", "7.1", "7.2"] },
    { "id": 4, "tasks": ["7.3", "7.4", "7.5", "8.1"] },
    { "id": 5, "tasks": ["8.2", "8.3", "9.1"] }
  ]
}
```
