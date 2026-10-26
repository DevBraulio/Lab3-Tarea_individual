/**
 * @fileoverview JSDoc type definitions for the Weather Forecast App.
 * Corresponds to the TypeScript interfaces defined in design.md § Components and Interfaces.
 */

/**
 * Global application state — discriminated union.
 *
 * @typedef {Object} IdleState
 * @property {'idle'} status
 *
 * @typedef {Object} LoadingState
 * @property {'loading'} status
 *
 * @typedef {Object} SuccessState
 * @property {'success'} status
 * @property {WeatherResult} data
 *
 * @typedef {Object} ErrorState
 * @property {'error'} status
 * @property {string} message
 *
 * @typedef {IdleState | LoadingState | SuccessState | ErrorState} AppState
 */

/**
 * Result of a successful weather query.
 *
 * @typedef {Object} WeatherResult
 * @property {string}      cityName      - Name of the city as returned by the Geocoding API.
 * @property {number|null} temperature   - Temperature in °C (1 decimal), or null if unavailable.
 * @property {number|null} humidity      - Relative humidity as integer 0–100, or null if unavailable.
 * @property {number|null} precipitation - Precipitation in mm (1 decimal), or null if unavailable.
 */

/**
 * Normalised result from the Geocoding API.
 *
 * @typedef {Object} GeocodingResult
 * @property {number} latitude  - Geographic latitude.
 * @property {number} longitude - Geographic longitude.
 * @property {string} name      - City name as returned by the Geocoding API.
 */

/**
 * Typed error — discriminated union on `kind`.
 *
 * @typedef {'empty_input'
 *   | 'city_not_found'
 *   | 'geocoding_unavailable'
 *   | 'weather_unavailable'
 *   | 'weather_timeout'
 *   | 'unexpected_geocoding_response'
 *   | 'unexpected_weather_response'} AppErrorKind
 *
 * @typedef {Object} AppError
 * @property {AppErrorKind} kind - Discriminant identifying the error type.
 */

export {};
