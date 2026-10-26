/**
 * @fileoverview Weather API service.
 * Fetches current weather data (temperature, humidity, precipitation) from the Open-Meteo API.
 *
 * Endpoint: GET https://api.open-meteo.com/v1/forecast
 *
 * Requirement references: 3.1, 3.2, 3.4, 3.5, 3.6, 5.2
 */

const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 10_000; // Requirement 3.6: 10-second timeout

/**
 * Fetches the current weather for the given coordinates.
 *
 * @param {number} lat       - Geographic latitude.
 * @param {number} lon       - Geographic longitude.
 * @param {string} cityName  - City name (passed through to the result).
 * @returns {Promise<import('../types.js').WeatherResult>}
 * @throws {import('../types.js').AppError} On any error condition (see design.md § Data Models).
 *
 * Error mapping:
 *  - AbortError (timeout > 10 s) → { kind: 'weather_timeout' }
 *  - Network error              → { kind: 'weather_unavailable' }
 *  - HTTP 4xx–5xx               → { kind: 'weather_unavailable' }
 *  - `current` absent or null   → { kind: 'unexpected_weather_response' }
 */
export async function fetchWeather(lat, lon, cityName) {
  // Requirement 3.1: build URL with required current variables (Property 5)
  const url = new URL(WEATHER_BASE_URL);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,precipitation');

  // Requirement 3.6: AbortController timeout (design.md § Error Handling)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url.toString(), { signal: controller.signal });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw { kind: 'weather_timeout' };
    }
    throw { kind: 'weather_unavailable' };
  } finally {
    clearTimeout(timeoutId);
  }

  // Requirement 3.5: HTTP error codes
  if (!response.ok) {
    throw { kind: 'weather_unavailable' };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw { kind: 'unexpected_weather_response' };
  }

  // Requirement 5.2: missing or null `current` field
  if (!Object.prototype.hasOwnProperty.call(data, 'current') || data.current === null) {
    throw { kind: 'unexpected_weather_response' };
  }

  const current = data.current;

  // Requirement 3.2, 4.5: extract fields, use null for missing values (Property 6)
  return {
    cityName,
    temperature:   current.temperature_2m    != null ? current.temperature_2m    : null,
    humidity:      current.relative_humidity_2m != null ? current.relative_humidity_2m : null,
    precipitation: current.precipitation      != null ? current.precipitation      : null,
  };
}
