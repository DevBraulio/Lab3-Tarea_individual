/**
 * @fileoverview Pure formatting functions for weather data display.
 * All functions are stateless and deterministic — ideal for property-based testing.
 *
 * Requirement references: 4.2, 4.3, 4.4, 4.5
 * Design reference: design.md § Property 7
 */

/** Indicator shown when a data field is unavailable. */
export const NA_INDICATOR = 'N/A';

/**
 * Formats a temperature value for display.
 * - Returns N/A for null/undefined values (Requirement 4.5).
 * - Returns value with exactly 1 decimal and "°C" unit (Requirement 4.2).
 *
 * @param {number|null|undefined} value - Temperature in °C.
 * @returns {string} e.g. "12.3°C" or "N/A"
 */
export function formatTemperature(value) {
  if (value == null) return NA_INDICATOR;
  return `${value.toFixed(1)}°C`;
}

/**
 * Formats a relative humidity value for display.
 * - Returns N/A for null/undefined values (Requirement 4.5).
 * - Returns rounded integer and "%" unit (Requirement 4.3).
 *
 * @param {number|null|undefined} value - Humidity as percentage 0–100.
 * @returns {string} e.g. "65%" or "N/A"
 */
export function formatHumidity(value) {
  if (value == null) return NA_INDICATOR;
  return `${Math.round(value)}%`;
}

/**
 * Formats a precipitation value for display.
 * - Returns N/A for null/undefined values (Requirement 4.5).
 * - Returns value with exactly 1 decimal and " mm" unit (Requirement 4.4).
 *
 * @param {number|null|undefined} value - Precipitation in mm.
 * @returns {string} e.g. "0.0 mm" or "N/A"
 */
export function formatPrecipitation(value) {
  if (value == null) return NA_INDICATOR;
  return `${value.toFixed(1)} mm`;
}

/**
 * Maps every AppError kind to its user-facing Spanish message.
 * (design.md § Data Models — "Mensajes de error por tipo")
 *
 * @param {import('../types.js').AppError} appError
 * @returns {string} User-facing error message in Spanish.
 */
export function getErrorMessage(appError) {
  switch (appError.kind) {
    case 'empty_input':
      return 'Por favor, ingresa el nombre de una ciudad';
    case 'city_not_found':
      return 'No se encontró la ciudad. Verifica el nombre e intenta de nuevo.';
    case 'geocoding_unavailable':
      return 'El servicio de geocodificación no está disponible. Intenta más tarde.';
    case 'weather_unavailable':
      return 'No fue posible obtener el pronóstico. Intenta más tarde.';
    case 'weather_timeout':
      return 'El servicio tardó demasiado en responder. Intenta más tarde.';
    case 'unexpected_geocoding_response':
      return 'La respuesta del servicio de geocodificación fue inesperada.';
    case 'unexpected_weather_response':
      return 'La respuesta del servicio de clima fue inesperada.';
    default:
      return 'Ocurrió un error inesperado. Intenta más tarde.';
  }
}
