/**
 * @fileoverview Unit + property-based tests for src/state/store.js and src/state/actions.js
 *
 * Tasks: 5.3, 5.4, 5.5
 * Properties tested: 1 (Whitespace input), 9 (New search clears previous state)
 * Requirements: 1.3, 1.4, 4.7, 5.3, 5.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// We need to reset module state between tests since store uses module-level state
// Vitest supports this via vi.resetModules() + dynamic imports

describe('store.js — unit tests', () => {
  let store;

  beforeEach(async () => {
    vi.resetModules();
    store = await import('../state/store.js');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Task 5.5 — Test: estado inicial es idle
  it('initial state is idle', () => {
    expect(store.getState()).toEqual({ status: 'idle' });
  });

  // Task 5.5 — Test: SEARCH_START transiciona a loading
  it('SEARCH_START transitions to loading and clears previous data', () => {
    // First set a success state
    store.dispatch({ type: 'SEARCH_SUCCESS', payload: { cityName: 'Madrid', temperature: 20, humidity: 60, precipitation: 0 } });
    expect(store.getState().status).toBe('success');

    // Then dispatch SEARCH_START
    store.dispatch({ type: 'SEARCH_START' });
    expect(store.getState()).toEqual({ status: 'loading' });
    // No data or message in loading state (Requirement 4.7)
    expect(store.getState().data).toBeUndefined();
    expect(store.getState().message).toBeUndefined();
  });

  // Task 5.5 — Test: SEARCH_SUCCESS transiciona a success con datos correctos
  it('SEARCH_SUCCESS transitions to success with the provided WeatherResult', () => {
    const weatherData = { cityName: 'Tokyo', temperature: 22.5, humidity: 75, precipitation: 1.2 };
    store.dispatch({ type: 'SEARCH_SUCCESS', payload: weatherData });
    expect(store.getState()).toEqual({ status: 'success', data: weatherData });
  });

  // Task 5.5 — Test: SEARCH_ERROR transiciona a error con mensaje correcto
  it('SEARCH_ERROR transitions to error with the provided message', () => {
    store.dispatch({ type: 'SEARCH_ERROR', payload: 'Ciudad no encontrada.' });
    expect(store.getState()).toEqual({ status: 'error', message: 'Ciudad no encontrada.' });
  });

  // Task 5.5 — Test: INPUT_EMPTY transiciona a error con mensaje de validación
  it('INPUT_EMPTY transitions to error with the validation message', () => {
    store.dispatch({ type: 'INPUT_EMPTY', payload: 'Por favor, ingresa el nombre de una ciudad' });
    expect(store.getState()).toEqual({
      status: 'error',
      message: 'Por favor, ingresa el nombre de una ciudad',
    });
  });

  // Test: renderCallback is called after each dispatch
  it('calls renderCallback after each dispatch', () => {
    const callback = vi.fn();
    store.setRenderCallback(callback);
    store.dispatch({ type: 'SEARCH_START' });
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith({ status: 'loading' });
  });

  // Test: SEARCH_START clears error state too
  it('SEARCH_START clears error state (Property 9)', () => {
    store.dispatch({ type: 'SEARCH_ERROR', payload: 'Some error' });
    expect(store.getState().status).toBe('error');
    store.dispatch({ type: 'SEARCH_START' });
    expect(store.getState()).toEqual({ status: 'loading' });
  });
});

describe('actions.js — unit tests', () => {
  let store;
  let actions;

  beforeEach(async () => {
    vi.resetModules();
    store   = await import('../state/store.js');
    actions = await import('../state/actions.js');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Task 5.5 — Test: input vacío no llama a geocodeCity
  it('empty input dispatches INPUT_EMPTY and does not call geocodeCity', async () => {
    global.fetch = vi.fn();
    await actions.searchCity('');
    expect(store.getState().status).toBe('error');
    expect(store.getState().message).toBe('Por favor, ingresa el nombre de una ciudad');
    // fetch should NOT have been called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // Task 5.5 — Test: input de solo espacios no llama a geocodeCity
  it('whitespace-only input dispatches INPUT_EMPTY without API call', async () => {
    global.fetch = vi.fn();
    await actions.searchCity('   ');
    expect(store.getState().status).toBe('error');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // Test: valid input dispatches SEARCH_START then SEARCH_SUCCESS on success
  it('dispatches SEARCH_START → SEARCH_SUCCESS on happy path', async () => {
    const states = [];
    store.setRenderCallback((s) => states.push({ ...s }));

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ name: 'Madrid', latitude: 40.4165, longitude: -3.70256 }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current: { temperature_2m: 20, relative_humidity_2m: 60, precipitation: 0 },
        }),
      });

    await actions.searchCity('Madrid');

    expect(states[0].status).toBe('loading');
    expect(states[1].status).toBe('success');
    expect(states[1].data.cityName).toBe('Madrid');
  });

  // Test: API error dispatches SEARCH_ERROR
  it('dispatches SEARCH_ERROR when geocoding fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('network fail'));
    await actions.searchCity('InvalidCity');
    expect(store.getState().status).toBe('error');
    expect(store.getState().message).toContain('geocodificación');
  });
});

// ─── Property-based tests ─────────────────────────────────────────────────────

describe('actions.js — property tests', () => {
  let store;
  let actions;

  beforeEach(async () => {
    vi.resetModules();
    store   = await import('../state/store.js');
    actions = await import('../state/actions.js');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Feature: weather-forecast-app, Property 1: Whitespace input always produces validation error
  // Task 5.3 — Validates: Requirements 1.3, 1.4, 2.6
  it('Property 1: any whitespace-only input always produces validation error without API call', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate strings composed only of whitespace characters (fast-check v4 compatible)
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^ \t\n\r]/g, ' ')).filter(s => s.trim() === ''),
        async (whitespaceInput) => {
          global.fetch = vi.fn();
          await actions.searchCity(whitespaceInput);

          const state = store.getState();
          // Property 1: must be error state
          expect(state.status).toBe('error');
          // Property 1: message must be the empty_input message
          expect(state.message).toBe('Por favor, ingresa el nombre de una ciudad');
          // Property 1: no API call should have been made
          expect(global.fetch).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: weather-forecast-app, Property 9: Nueva búsqueda limpia el estado previo
  // Task 5.4 — Validates: Requirements 4.7
  it('Property 9: new valid search always transitions to loading before API response', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (cityName) => {
          const observedStatuses = [];
          store.setRenderCallback((s) => observedStatuses.push(s.status));

          // Pre-set a non-idle state
          store.dispatch({ type: 'SEARCH_SUCCESS', payload: { cityName: 'Old', temperature: 10, humidity: 50, precipitation: 0 } });

          // Never-resolving fetch to capture the loading state
          global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

          // Don't await — we just want to observe the synchronous loading dispatch
          actions.searchCity(cityName);

          // Property 9: the first status after starting must be 'loading'
          const loadingIdx = observedStatuses.indexOf('loading');
          expect(loadingIdx).toBeGreaterThanOrEqual(0);
          // And it must come after the previous success state was set
          expect(loadingIdx).toBeGreaterThan(0);
        }
      ),
      { numRuns: 50 }
    );
  });
});
