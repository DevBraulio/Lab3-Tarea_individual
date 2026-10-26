/**
 * @fileoverview Geocoding API service.
 * Converts a city name to geographic coordinates using the Open-Meteo Geocoding API.
 *
 * Endpoint: GET https://geocoding-api.open-meteo.com/v1/search
 *
 * Requirement references: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1
 */

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/**
 * Converts a city name to geographic coordinates.
 *
 * @param {string} cityName - The city name to geocode (will be trimmed internally).
 * @returns {Promise<import('../types.js').GeocodingResult>} Resolved with the first matching result.
 * @throws {import('../types.js').AppError} On any error condition (see design.md § Data Models).
 *
 * Error mapping:
 *  - Network error / HTTP 4xx–5xx → { kind: 'geocoding_unavailable' }
 *  - `results` field absent or null → { kind: 'unexpected_geocoding_response' }
 *  - `results` is an empty array  → { kind: 'city_not_found' }
 */
export async function geocodeCity(cityName) {
  const trimmed = cityName.trim();

  // Requirement 2.1, 2.5: build URL with count=1
  const url = new URL(GEOCODING_BASE_URL);
  url.searchParams.set('name', trimmed);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  let response;
  try {
    response = await fetch(url.toString());
  } catch {
    // Requirement 2.4: network error
    throw { kind: 'geocoding_unavailable' };
  }

  // Requirement 2.4: HTTP error
  if (!response.ok) {
    throw { kind: 'geocoding_unavailable' };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw { kind: 'unexpected_geocoding_response' };
  }

  // Requirement 5.1: missing or null `results` field
  if (!Object.prototype.hasOwnProperty.call(data, 'results') || data.results === null) {
    throw { kind: 'unexpected_geocoding_response' };
  }

  // Requirement 2.3: empty results
  if (!Array.isArray(data.results) || data.results.length === 0) {
    throw { kind: 'city_not_found' };
  }

  // Requirement 2.2: use first result
  const first = data.results[0];
  return {
    latitude: first.latitude,
    longitude: first.longitude,
    name: first.name,
  };
}
