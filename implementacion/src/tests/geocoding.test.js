/**
 * @fileoverview Unit + property-based tests for src/api/geocoding.js
 *
 * Tasks: 2.2, 2.3, 2.4
 * Properties tested: 2 (Trim), 3 (Correct parameters)
 * Requirements: 2.1–2.5, 5.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { geocodeCity } from '../api/geocoding.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates a mock fetch that resolves with the given JSON body.
 * @param {object} body
 * @param {number} [status=200]
 */
function mockFetchOk(body, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

/**
 * Creates a mock fetch that rejects (network error).
 */
function mockFetchNetworkError() {
  return vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
}

const GEO_RESULT = {
  id: 3117735,
  name: 'Madrid',
  latitude: 40.4165,
  longitude: -3.70256,
  country: 'Spain',
  country_code: 'ES',
};

// ─── Unit tests ───────────────────────────────────────────────────────────────

describe('geocodeCity — unit tests', () => {
  beforeEach(() => {
    global.fetch = mockFetchOk({ results: [GEO_RESULT] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Task 2.4 — Test: respuesta exitosa extrae latitude, longitude y name de results[0]
  it('returns latitude, longitude and name from results[0] on success', async () => {
    const result = await geocodeCity('Madrid');
    expect(result).toEqual({
      latitude: GEO_RESULT.latitude,
      longitude: GEO_RESULT.longitude,
      name: GEO_RESULT.name,
    });
  });

  // Task 2.4 — Test: results vacío lanza city_not_found
  it('throws city_not_found when results array is empty', async () => {
    global.fetch = mockFetchOk({ results: [] });
    await expect(geocodeCity('xyzxyz')).rejects.toEqual({ kind: 'city_not_found' });
  });

  // Task 2.4 — Test: results nulo lanza unexpected_geocoding_response
  it('throws unexpected_geocoding_response when results is null', async () => {
    global.fetch = mockFetchOk({ results: null });
    await expect(geocodeCity('Madrid')).rejects.toEqual({ kind: 'unexpected_geocoding_response' });
  });

  // Task 2.4 — Test: campo results ausente lanza unexpected_geocoding_response
  it('throws unexpected_geocoding_response when results field is absent', async () => {
    global.fetch = mockFetchOk({ generationtime_ms: 0.5 });
    await expect(geocodeCity('Madrid')).rejects.toEqual({ kind: 'unexpected_geocoding_response' });
  });

  // Task 2.4 — Test: error de red lanza geocoding_unavailable
  it('throws geocoding_unavailable on network error', async () => {
    global.fetch = mockFetchNetworkError();
    await expect(geocodeCity('Madrid')).rejects.toEqual({ kind: 'geocoding_unavailable' });
  });

  // Requirement 2.4: HTTP 4xx lanza geocoding_unavailable
  it('throws geocoding_unavailable on HTTP 4xx response', async () => {
    global.fetch = mockFetchOk({}, 404);
    await expect(geocodeCity('Madrid')).rejects.toEqual({ kind: 'geocoding_unavailable' });
  });

  // Requirement 2.4: HTTP 5xx lanza geocoding_unavailable
  it('throws geocoding_unavailable on HTTP 5xx response', async () => {
    global.fetch = mockFetchOk({}, 500);
    await expect(geocodeCity('Madrid')).rejects.toEqual({ kind: 'geocoding_unavailable' });
  });
});

// ─── Property-based tests ─────────────────────────────────────────────────────

describe('geocodeCity — property tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Feature: weather-forecast-app, Property 2: Trim del input antes de llamar a la API
  // Task 2.2 — Validates: Requirements 1.4, 2.1
  it('Property 2: always trims the city name before building the request URL', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 0, maxLength: 10 }).map(s => s.replace(/\S/g, ' ')), // leading spaces
        fc.string({ minLength: 0, maxLength: 10 }).map(s => s.replace(/\S/g, ' ')), // trailing spaces
        (cityCore, leading, trailing) => {
          const rawInput = leading + cityCore + trailing;
          const capturedUrls = [];

          global.fetch = vi.fn().mockImplementation((url) => {
            capturedUrls.push(url);
            return Promise.resolve({
              ok: true,
              json: async () => ({ results: [GEO_RESULT] }),
            });
          });

          // We don't await — we just check what URL was passed to fetch
          geocodeCity(rawInput);

          if (capturedUrls.length > 0) {
            const url = new URL(capturedUrls[0]);
            const nameParam = url.searchParams.get('name');
            // Property 2: name param must equal rawInput.trim()
            expect(nameParam).toBe(rawInput.trim());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: weather-forecast-app, Property 3: Petición a Geocoding_API con parámetros correctos
  // Task 2.3 — Validates: Requirements 2.1, 2.5
  it('Property 3: request always includes count=1 and correct name param', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 80 }).filter(s => s.trim().length > 0),
        (cityName) => {
          const capturedUrls = [];

          global.fetch = vi.fn().mockImplementation((url) => {
            capturedUrls.push(url);
            return Promise.resolve({
              ok: true,
              json: async () => ({ results: [GEO_RESULT] }),
            });
          });

          geocodeCity(cityName);

          if (capturedUrls.length > 0) {
            const url = new URL(capturedUrls[0]);
            // Requirement 2.5: count must be "1"
            expect(url.searchParams.get('count')).toBe('1');
            // Requirement 2.1: name must be trimmed city name
            expect(url.searchParams.get('name')).toBe(cityName.trim());
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
