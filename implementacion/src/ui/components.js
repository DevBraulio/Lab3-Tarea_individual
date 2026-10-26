/**
 * @fileoverview DOM rendering functions for each UI component.
 * Each function is responsible for a single component and enforces
 * the mutual exclusivity invariants defined in design.md § Property 8.
 *
 * Requirement references: 1.1, 3.3, 4.1–4.6, 5.3, 5.4, 5.5
 */

import { formatTemperature, formatHumidity, formatPrecipitation } from './formatters.js';

// ─── Element references ──────────────────────────────────────────────────────

/** @returns {HTMLElement} */
const el = (id) => document.getElementById(id);

// ─── Public rendering functions ──────────────────────────────────────────────

/**
 * Shows or hides the LoadingIndicator.
 * Requirement 3.3: spinner visible while any API request is in-flight.
 * Requirement 4.6: minimum 24×24 px (enforced in CSS).
 *
 * @param {boolean} visible
 */
export function renderLoading(visible) {
  const indicator = el('loading-indicator');
  if (visible) {
    indicator.removeAttribute('hidden');
  } else {
    indicator.setAttribute('hidden', '');
  }
}

/**
 * Populates and shows the ForecastDisplay; hides the ErrorDisplay.
 * Property 8: ForecastDisplay and ErrorDisplay are mutually exclusive.
 *
 * Requirement 4.1: city name.
 * Requirement 4.2: temperature (1 decimal, °C).
 * Requirement 4.3: humidity (integer, %).
 * Requirement 4.4: precipitation (1 decimal, mm).
 * Requirement 4.5: N/A for missing fields.
 *
 * @param {import('../types.js').WeatherResult} weatherResult
 */
export function renderForecast(weatherResult) {
  el('forecast-city').textContent    = weatherResult.cityName;
  el('forecast-temp').textContent    = formatTemperature(weatherResult.temperature);
  el('forecast-humidity').textContent = formatHumidity(weatherResult.humidity);
  el('forecast-precip').textContent  = formatPrecipitation(weatherResult.precipitation);

  // Property 8: hide ErrorDisplay before showing ForecastDisplay
  el('error-display').setAttribute('hidden', '');
  el('forecast-display').removeAttribute('hidden');
}

/**
 * Shows the ErrorDisplay with the given message; hides the ForecastDisplay.
 * Re-enables and focuses City_Input so the user can retry without reloading.
 * Property 8: ForecastDisplay and ErrorDisplay are mutually exclusive.
 *
 * Requirement 5.3: ErrorDisplay visible → ForecastDisplay hidden.
 * Requirement 5.5: City_Input enabled and focused after any error.
 * Property 10: City_Input never disabled.
 *
 * @param {string} message - User-facing error message.
 */
export function renderError(message) {
  el('error-message').textContent = message;

  // Property 8: hide ForecastDisplay before showing ErrorDisplay
  el('forecast-display').setAttribute('hidden', '');
  el('error-display').removeAttribute('hidden');

  // Requirement 5.5, Property 10: re-enable and focus City_Input
  const input = el('city-input');
  input.disabled = false;
  input.focus();
}

/**
 * Hides both ForecastDisplay and ErrorDisplay (initial / idle state).
 * Property 8: both panels are hidden when status is 'idle' or 'loading'.
 */
export function renderIdle() {
  el('forecast-display').setAttribute('hidden', '');
  el('error-display').setAttribute('hidden', '');
}
