/**
 * @fileoverview Unit + property-based tests for src/api/weather.js
 *
 * Tasks: 3.2, 3.3, 3.4, 3.5
 * Properties tested: 4 (Coordinates forwarded), 5 (Required variables), 6 (Data extraction)
 * Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 5.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { fetchWeather } from '../api/weather.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCurrentData(temp, humidity, precip) {
  return {
    time: '2025-01-15T14:00',
    interval: 900,
    temperature_2m: temp,
    relative_humidity_2m: humidity,
    precipitation: precip,
  };
}

function mockFetchOk(body) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  });
}

function mockFetchNetworkError() {
  return vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
}

function mockFetchStatus(status) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({}),
  });
}

// ─── Unit tests ───────────────────────────────────────────────────────────────

describe('fetchWeather — unit tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Task 3.5 — Test: respuesta exitosa mapea los tres campos correctamente
  it('maps all three fields correctly on success', async () => {
    global.fetch = mockFetchOk({
      current: makeCurrentData(12.3, 65, 0.0),
    });
    const result = await fetchWeather(40.4165, -3.70256, 'Madrid');
    expect(result).toEqual({
      cityName: 'Madrid',
      temperature: 12.3,
      humidity: 65,
      precipitation: 0.0,
    });
  });

  // Task 3.5 — Test: campo current nulo lanza unexpected_weather_response
  it('throws unexpected_weather_response when current is null', async () => {
    global.fetch = mockFetchOk({ current: null });
    await expect(fetchWeather(40.4165, -3.70256, 'Madrid')).rejects.toEqual({
      kind: 'unexpected_weather_response',
    });
  });

  // Task 3.5 — Test: campo current ausente lanza unexpected_weather_response
  it('throws unexpected_weather_response when current field is absent', async () => {
    global.fetch = mockFetchOk({ latitude: 40.42 });
    await expect(fetchWeather(40.4165, -3.70256, 'Madrid')).rejects.toEqual({
      kind: 'unexpected_weather_response',
    });
  });

  // Task 3.5 — Test: error de red lanza weather_unavailable
  it('throws weather_unavailable on network error', async () => {
    global.fetch = mockFetchNetworkError();
    await expect(fetchWeather(40.4165, -3.70256, 'Madrid')).rejects.toEqual({
      kind: 'weather_unavailable',
    });
  });

  // Task 3.5 — Test: HTTP 500 lanza weather_unavailable
  it('throws weather_unavailable on HTTP 500', async () => {
    global.fetch = mockFetchStatus(500);
    await expect(fetchWeather(40.4165, -3.70256, 'Madrid')).rejects.toEqual({
      kind: 'weather_unavailable',
    });
  });

  // Task 3.5 — Test: HTTP 404 lanza weather_unavailable
  it('throws weather_unavailable on HTTP 404', async () => {
    global.fetch = mockFetchStatus(404);
    await expect(fetchWeather(40.4165, -3.70256, 'Madrid')).rejects.toEqual({
      kind: 'weather_unavailable',
    });
  });

  // Requirement 3.6 — Test: timeout de 10s lanza weather_timeout
  it('throws weather_timeout when request is aborted (AbortError)', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    global.fetch = vi.fn().mockRejectedValue(abortError);
    await expect(fetchWeather(40.4165, -3.70256, 'Madrid')).rejects.toEqual({
      kind: 'weather_timeout',
    });
  });

  // Requirement 4.5 — Test: missing fields return null
  it('returns null for missing temperature_2m, relative_humidity_2m, precipitation', async () => {
    global.fetch = mockFetchOk({
      current: { time: '2025-01-15T14:00', interval: 900 }, // no weather fields
    });
    const result = await fetchWeather(40.4165, -3.70256, 'Madrid');
    expect(result.temperature).toBeNull();
    expect(result.humidity).toBeNull();
    expect(result.precipitation).toBeNull();
  });
});

// ─── Property-based tests ─────────────────────────────────────────────────────

describe('fetchWeather — property tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Feature: weather-forecast-app, Property 4: Coordenadas del primer resultado se reenvían a la Weather_API
  // Task 3.2 — Validates: Requirements 2.2
  it('Property 4: forwards latitude and longitude exactly as received from geocoding', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -90, max: 90, noNaN: true }),
        fc.float({ min: -180, max: 180, noNaN: true }),
        (lat, lon) => {
          const capturedUrls = [];

          global.fetch = vi.fn().mockImplementation((url) => {
            capturedUrls.push(url);
            return Promise.resolve({
              ok: true,
              json: async () => ({ current: makeCurrentData(20, 50, 0) }),
            });
          });

          fetchWeather(lat, lon, 'TestCity');

          if (capturedUrls.length > 0) {
            const url = new URL(capturedUrls[0]);
            // Property 4: latitude and longitude must match exactly
            expect(parseFloat(url.searchParams.get('latitude'))).toBeCloseTo(lat, 5);
            expect(parseFloat(url.searchParams.get('longitude'))).toBeCloseTo(lon, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: weather-forecast-app, Property 5: Petición a Weather_API incluye las variables requeridas
  // Task 3.3 — Validates: Requirements 3.1
  it('Property 5: request always includes all three required current variables', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -90, max: 90, noNaN: true }),
        fc.float({ min: -180, max: 180, noNaN: true }),
        (lat, lon) => {
          const capturedUrls = [];

          global.fetch = vi.fn().mockImplementation((url) => {
            capturedUrls.push(url);
            return Promise.resolve({
              ok: true,
              json: async () => ({ current: makeCurrentData(20, 50, 0) }),
            });
          });

          fetchWeather(lat, lon, 'TestCity');

          if (capturedUrls.length > 0) {
            const url = new URL(capturedUrls[0]);
            const currentParam = url.searchParams.get('current') || '';
            const fields = currentParam.split(',');
            // Property 5: all three variables must be present
            expect(fields).toContain('temperature_2m');
            expect(fields).toContain('relative_humidity_2m');
            expect(fields).toContain('precipitation');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: weather-forecast-app, Property 6: Extracción de datos desde la respuesta de la Weather_API
  // Task 3.4 — Validates: Requirements 3.2, 4.5
  it('Property 6: WeatherResult fields match current object values (or null if missing)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.float({ min: Math.fround(-99.9), max: Math.fround(99.9), noNaN: true }), { nil: null }),
        fc.option(fc.integer({ min: 0, max: 100 }), { nil: null }),
        fc.option(fc.float({ min: 0, max: Math.fround(999.9), noNaN: true }), { nil: null }),
        async (temp, humidity, precip) => {
          const currentObj = {};
          if (temp !== null)     currentObj.temperature_2m         = temp;
          if (humidity !== null) currentObj.relative_humidity_2m   = humidity;
          if (precip !== null)   currentObj.precipitation           = precip;

          global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ current: currentObj }),
          });

          const result = await fetchWeather(0, 0, 'City');
          // Property 6: each field maps to the current value or null
          expect(result.temperature).toBe(temp !== null ? currentObj.temperature_2m : null);
          expect(result.humidity).toBe(humidity !== null ? currentObj.relative_humidity_2m : null);
          expect(result.precipitation).toBe(precip !== null ? currentObj.precipitation : null);
        }
      ),
      { numRuns: 100 }
    );
  });
});
