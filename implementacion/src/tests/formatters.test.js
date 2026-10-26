/**
 * @fileoverview Unit + property-based tests for src/ui/formatters.js
 *
 * Tasks: 6.2, 6.3
 * Properties tested: 7 (Correct rendering of weather data)
 * Requirements: 4.2, 4.3, 4.4, 4.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  formatTemperature,
  formatHumidity,
  formatPrecipitation,
  getErrorMessage,
  NA_INDICATOR,
} from '../ui/formatters.js';

// ─── Unit tests ───────────────────────────────────────────────────────────────

describe('formatTemperature — unit tests', () => {
  // Task 6.3
  it('returns N/A for null', () => {
    expect(formatTemperature(null)).toBe('N/A');
  });

  it('returns N/A for undefined', () => {
    expect(formatTemperature(undefined)).toBe('N/A');
  });

  it('formats positive temperature with 1 decimal and °C', () => {
    expect(formatTemperature(12.345)).toBe('12.3°C');
  });

  it('formats negative temperature correctly', () => {
    expect(formatTemperature(-5.0)).toBe('-5.0°C');
  });

  it('formats zero correctly', () => {
    expect(formatTemperature(0)).toBe('0.0°C');
  });
});

describe('formatHumidity — unit tests', () => {
  // Task 6.3
  it('returns N/A for null', () => {
    expect(formatHumidity(null)).toBe('N/A');
  });

  it('returns N/A for undefined', () => {
    expect(formatHumidity(undefined)).toBe('N/A');
  });

  it('rounds humidity to nearest integer and appends %', () => {
    expect(formatHumidity(65.7)).toBe('66%');
  });

  it('formats humidity of 0', () => {
    expect(formatHumidity(0)).toBe('0%');
  });

  it('formats humidity of 100', () => {
    expect(formatHumidity(100)).toBe('100%');
  });
});

describe('formatPrecipitation — unit tests', () => {
  // Task 6.3
  it('returns N/A for null', () => {
    expect(formatPrecipitation(null)).toBe('N/A');
  });

  it('returns N/A for undefined', () => {
    expect(formatPrecipitation(undefined)).toBe('N/A');
  });

  it('formats 0 precipitation with 1 decimal', () => {
    expect(formatPrecipitation(0)).toBe('0.0 mm');
  });

  it('formats precipitation value with 1 decimal and mm', () => {
    expect(formatPrecipitation(12.567)).toBe('12.6 mm');
  });
});

describe('getErrorMessage — unit tests', () => {
  // Task 6.3: covers all AppError.kind values
  const cases = [
    ['empty_input', 'Por favor, ingresa el nombre de una ciudad'],
    ['city_not_found', 'No se encontró la ciudad'],
    ['geocoding_unavailable', 'servicio de geocodificación'],
    ['weather_unavailable', 'pronóstico'],
    ['weather_timeout', 'tardó demasiado'],
    ['unexpected_geocoding_response', 'respuesta del servicio de geocodificación fue inesperada'],
    ['unexpected_weather_response', 'respuesta del servicio de clima fue inesperada'],
  ];

  cases.forEach(([kind, expectedFragment]) => {
    it(`returns correct message for ${kind}`, () => {
      const msg = getErrorMessage({ kind });
      expect(msg).toContain(expectedFragment);
    });
  });
});

// ─── Property-based tests ─────────────────────────────────────────────────────

describe('formatters — property tests', () => {
  // Feature: weather-forecast-app, Property 7: Renderizado correcto de los datos meteorológicos
  // Task 6.2 — Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5

  // Property 7a: formatTemperature with non-null values
  it('Property 7a: formatTemperature always produces N/A for null or "X.Y°C" for numbers', () => {
    fc.assert(
      fc.property(
        fc.option(fc.float({ min: Math.fround(-99.9), max: Math.fround(99.9), noNaN: true }), { nil: null }),
        (value) => {
          const result = formatTemperature(value);
          if (value === null) {
            expect(result).toBe(NA_INDICATOR);
          } else {
            // Must end with °C and have exactly 1 decimal digit (e.g. "-0.0°C", "12.3°C")
            expect(result).toMatch(/^-?\d+\.\d°C$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 7b: formatHumidity with non-null values
  it('Property 7b: formatHumidity always produces N/A for null or "X%" for integers', () => {
    fc.assert(
      fc.property(
        fc.option(fc.integer({ min: 0, max: 100 }), { nil: null }),
        (value) => {
          const result = formatHumidity(value);
          if (value === null) {
            expect(result).toBe(NA_INDICATOR);
          } else {
            // Must end with %
            expect(result).toMatch(/%$/);
            // Must be an integer
            const numPart = parseInt(result.replace('%', ''), 10);
            expect(numPart).toBe(Math.round(value));
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 7c: formatPrecipitation with non-null values
  it('Property 7c: formatPrecipitation always produces N/A for null or "X.Y mm" for numbers', () => {
    fc.assert(
      fc.property(
        fc.option(fc.float({ min: 0, max: Math.fround(999.9), noNaN: true }), { nil: null }),
        (value) => {
          const result = formatPrecipitation(value);
          if (value === null) {
            expect(result).toBe(NA_INDICATOR);
          } else {
            // Must end with " mm" and have exactly 1 decimal digit
            expect(result).toMatch(/^\d+\.\d mm$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
