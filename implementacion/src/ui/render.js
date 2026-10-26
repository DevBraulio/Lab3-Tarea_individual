/**
 * @fileoverview Main render dispatcher.
 * Switches on AppState.status and delegates to the appropriate component function.
 *
 * Requirement references: 5.3, 5.4
 * Design reference: design.md § UI Invariants
 */

import { renderLoading, renderForecast, renderError, renderIdle } from './components.js';

/**
 * Renders the UI based on the current application state.
 * This function is registered as the render callback in the State Manager.
 *
 * State → UI mapping:
 *  - 'idle'    → both panels hidden, no spinner
 *  - 'loading' → spinner visible, both panels hidden
 *  - 'success' → ForecastDisplay visible, ErrorDisplay hidden, no spinner
 *  - 'error'   → ErrorDisplay visible, ForecastDisplay hidden, no spinner
 *
 * @param {import('../types.js').AppState} appState
 */
export function render(appState) {
  switch (appState.status) {
    case 'idle':
      renderLoading(false);
      renderIdle();
      break;

    case 'loading':
      renderLoading(true);
      renderIdle(); // hide both panels while loading
      break;

    case 'success':
      renderLoading(false);
      renderForecast(appState.data);
      break;

    case 'error':
      renderLoading(false);
      renderError(appState.message);
      break;

    default:
      // Defensive: hide everything on unknown status
      renderLoading(false);
      renderIdle();
      break;
  }
}
