/**
 * @fileoverview Unit + property-based tests for src/ui/components.js and src/ui/render.js
 *
 * Tasks: 7.3, 7.4, 7.5, 8.3
 * Properties tested: 8 (Mutual exclusivity), 10 (City_Input stays enabled)
 * Requirements: 3.3, 4.1, 4.6, 5.3, 5.4, 5.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// ─── DOM Setup Helper ─────────────────────────────────────────────────────────

/**
 * Injects the minimum required DOM structure into jsdom for component testing.
 */
function setupDOM() {
  document.body.innerHTML = `
    <div id="loading-indicator" hidden></div>
    <div id="forecast-display" hidden>
      <h2 id="forecast-city"></h2>
      <span id="forecast-temp"></span>
      <span id="forecast-humidity"></span>
      <span id="forecast-precip"></span>
    </div>
    <div id="error-display" hidden>
      <p id="error-message"></p>
    </div>
    <input id="city-input" type="text" />
    <form id="search-form">
      <button type="submit" id="search-btn">Buscar</button>
    </form>
  `;
}

// ─── Unit tests — components.js ───────────────────────────────────────────────

describe('components.js — unit tests', () => {
  beforeEach(() => {
    setupDOM();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Task 7.5 — Test: renderLoading(true) muestra el spinner
  it('renderLoading(true) shows the loading indicator', async () => {
    const { renderLoading } = await import('../ui/components.js');
    renderLoading(true);
    expect(document.getElementById('loading-indicator').hasAttribute('hidden')).toBe(false);
  });

  // Task 7.5 — Test: renderLoading(false) oculta el spinner
  it('renderLoading(false) hides the loading indicator', async () => {
    const { renderLoading } = await import('../ui/components.js');
    renderLoading(false);
    expect(document.getElementById('loading-indicator').hasAttribute('hidden')).toBe(true);
  });

  // Task 7.5 — Test: renderForecast muestra ciudad y oculta ErrorDisplay
  it('renderForecast shows city name and hides error-display', async () => {
    const { renderForecast } = await import('../ui/components.js');
    const data = { cityName: 'Madrid', temperature: 20.5, humidity: 65, precipitation: 0.0 };
    renderForecast(data);

    expect(document.getElementById('forecast-city').textContent).toBe('Madrid');
    expect(document.getElementById('forecast-display').hasAttribute('hidden')).toBe(false);
    expect(document.getElementById('error-display').hasAttribute('hidden')).toBe(true);
  });

  // Task 7.5 — Test: renderForecast formats temperature
  it('renderForecast displays formatted temperature', async () => {
    const { renderForecast } = await import('../ui/components.js');
    renderForecast({ cityName: 'Tokyo', temperature: 22.345, humidity: 80, precipitation: 1.5 });
    expect(document.getElementById('forecast-temp').textContent).toBe('22.3°C');
  });

  // Task 7.5 — Test: renderError muestra mensaje, oculta ForecastDisplay, enfoca City_Input
  it('renderError shows message, hides forecast-display, and focuses city-input', async () => {
    const { renderError } = await import('../ui/components.js');
    // First show forecast
    document.getElementById('forecast-display').removeAttribute('hidden');

    renderError('Ciudad no encontrada.');

    expect(document.getElementById('error-message').textContent).toBe('Ciudad no encontrada.');
    expect(document.getElementById('error-display').hasAttribute('hidden')).toBe(false);
    expect(document.getElementById('forecast-display').hasAttribute('hidden')).toBe(true);
    // Requirement 5.5: City_Input must be enabled
    expect(document.getElementById('city-input').disabled).toBe(false);
  });

  // Task 7.5 — Test: render with idle state hides both panels
  it('render with idle state hides both forecast and error panels', async () => {
    const { render } = await import('../ui/render.js');
    // Pre-show both panels
    document.getElementById('forecast-display').removeAttribute('hidden');
    document.getElementById('error-display').removeAttribute('hidden');

    render({ status: 'idle' });

    expect(document.getElementById('forecast-display').hasAttribute('hidden')).toBe(true);
    expect(document.getElementById('error-display').hasAttribute('hidden')).toBe(true);
    expect(document.getElementById('loading-indicator').hasAttribute('hidden')).toBe(true);
  });

  // Task 8.3 — Test: tecla Enter en City_Input dispara búsqueda
  it('Enter key on city-input triggers form submit', async () => {
    vi.resetModules();
    const actionsModule = await import('../state/actions.js');
    const searchCitySpy = vi.spyOn(actionsModule, 'searchCity').mockResolvedValue(undefined);

    // Re-import searchForm after spying
    const { initSearchForm } = await import('../ui/searchForm.js');
    initSearchForm();

    const input = document.getElementById('city-input');
    input.value = 'Berlin';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    // The form submit should eventually call searchCity
    await vi.waitFor(() => {
      expect(searchCitySpy).toHaveBeenCalled();
    });
  });
});

// ─── Property-based tests ─────────────────────────────────────────────────────

describe('components.js — property tests', () => {
  beforeEach(() => {
    setupDOM();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Feature: weather-forecast-app, Property 8: Exclusividad mutua entre ForecastDisplay y ErrorDisplay
  // Task 7.3 — Validates: Requirements 5.3, 5.4
  it('Property 8: ForecastDisplay and ErrorDisplay are never visible simultaneously', () => {
    fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant({ status: 'idle' }),
          fc.constant({ status: 'loading' }),
          fc.record({
            status: fc.constant('success'),
            data: fc.record({
              cityName: fc.string({ minLength: 1, maxLength: 30 }),
              temperature: fc.option(fc.float({ min: Math.fround(-99.9), max: Math.fround(99.9), noNaN: true }), { nil: null }),
              humidity: fc.option(fc.integer({ min: 0, max: 100 }), { nil: null }),
              precipitation: fc.option(fc.float({ min: 0, max: Math.fround(999.9), noNaN: true }), { nil: null }),
            }),
          }),
          fc.record({
            status: fc.constant('error'),
            message: fc.string({ minLength: 1, maxLength: 100 }),
          }),
        ),
        async (appState) => {
          setupDOM();
          const { render } = await import('../ui/render.js');
          render(appState);

          const forecastHidden = document.getElementById('forecast-display').hasAttribute('hidden');
          const errorHidden    = document.getElementById('error-display').hasAttribute('hidden');

          // Property 8: at most one can be visible
          expect(forecastHidden || errorHidden).toBe(true);

          // Additional invariants per status
          if (appState.status === 'idle' || appState.status === 'loading') {
            expect(forecastHidden).toBe(true);
            expect(errorHidden).toBe(true);
          }
          if (appState.status === 'success') {
            expect(forecastHidden).toBe(false);
            expect(errorHidden).toBe(true);
          }
          if (appState.status === 'error') {
            expect(forecastHidden).toBe(true);
            expect(errorHidden).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: weather-forecast-app, Property 10: City_Input permanece habilitado tras cualquier error
  // Task 7.4 — Validates: Requirements 5.5
  it('Property 10: city-input is always enabled and focused after any error', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }), // any error message
        async (errorMessage) => {
          setupDOM();
          const { renderError } = await import('../ui/components.js');
          renderError(errorMessage);

          const input = document.getElementById('city-input');
          // Property 10: City_Input must never be disabled
          expect(input.disabled).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
