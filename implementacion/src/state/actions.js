/**
 * @fileoverview State actions orchestrator.
 * `searchCity` is the main entry point that wires together input validation,
 * geocoding, and weather fetching, dispatching the appropriate store actions.
 *
 * Requirement references: 1.3, 1.4, 2.1, 2.2, 2.6
 */

import { dispatch } from './store.js';
import { geocodeCity } from '../api/geocoding.js';
import { fetchWeather } from '../api/weather.js';
import { getErrorMessage } from '../ui/formatters.js';

/**
 * Orchestrates a city weather search:
 *  1. Trim and validate input (Requirement 1.3, 1.4, 2.6 — Property 1).
 *  2. Dispatch SEARCH_START to transition to loading (Requirement 4.7 — Property 9).
 *  3. Geocode the city name (Requirement 2.1, 2.2).
 *  4. Fetch weather for the returned coordinates (Requirement 3.1).
 *  5. Dispatch SEARCH_SUCCESS or SEARCH_ERROR.
 *
 * @param {string} rawCityName - Raw value from the City_Input field.
 * @returns {Promise<void>}
 */
export async function searchCity(rawCityName) {
  const trimmed = typeof rawCityName === 'string' ? rawCityName.trim() : '';

  // Requirement 1.3, 1.4, 2.6: empty/whitespace input → validation error, no API call
  if (trimmed.length === 0) {
    dispatch({
      type: 'INPUT_EMPTY',
      payload: getErrorMessage({ kind: 'empty_input' }),
    });
    return;
  }

  // Requirement 4.7, Property 9: synchronously transition to loading before any async work
  dispatch({ type: 'SEARCH_START' });

  try {
    // Requirement 2.1, 2.2: geocode city → coordinates
    const geoResult = await geocodeCity(trimmed);

    // Requirement 3.1: fetch weather with coordinates
    const weatherResult = await fetchWeather(geoResult.latitude, geoResult.longitude, geoResult.name);

    dispatch({ type: 'SEARCH_SUCCESS', payload: weatherResult });
  } catch (appError) {
    // Map AppError to user-facing message and dispatch error state
    const message = getErrorMessage(appError);
    dispatch({ type: 'SEARCH_ERROR', payload: message });
  }
}
