/**
 * @fileoverview State store — centralized state manager.
 * Holds the single AppState object and notifies the UI via a registered render callback.
 *
 * Requirement references: 4.7, 5.3, 5.4
 * Design reference: design.md § Architecture — "Estado centralizado en un único módulo"
 */

/** @type {import('../types.js').AppState} */
let state = { status: 'idle' };

/** @type {((state: import('../types.js').AppState) => void) | null} */
let renderCallback = null;

/**
 * Returns the current application state (read-only snapshot).
 * @returns {import('../types.js').AppState}
 */
export function getState() {
  return state;
}

/**
 * Registers the UI render function to be called on every state transition.
 * @param {(state: import('../types.js').AppState) => void} callback
 */
export function setRenderCallback(callback) {
  renderCallback = callback;
}

/**
 * Transitions the application state and notifies the render callback synchronously.
 * Supported actions:
 *  - SEARCH_START  → { status: 'loading' }                          (Req 4.7: clears previous state)
 *  - SEARCH_SUCCESS → { status: 'success', data: WeatherResult }    (Req 5.4)
 *  - SEARCH_ERROR   → { status: 'error', message: string }          (Req 5.3)
 *  - INPUT_EMPTY    → { status: 'error', message: string }          (Req 1.3)
 *
 * @param {{ type: 'SEARCH_START' | 'SEARCH_SUCCESS' | 'SEARCH_ERROR' | 'INPUT_EMPTY', payload?: any }} action
 */
export function dispatch(action) {
  switch (action.type) {
    case 'SEARCH_START':
      // Requirement 4.7, Property 9: synchronously clear previous result/error → loading
      state = { status: 'loading' };
      break;

    case 'SEARCH_SUCCESS':
      // Requirement 5.4: ForecastDisplay visible, ErrorDisplay hidden
      state = { status: 'success', data: action.payload };
      break;

    case 'SEARCH_ERROR':
      // Requirement 5.3: ErrorDisplay visible, ForecastDisplay hidden
      state = { status: 'error', message: action.payload };
      break;

    case 'INPUT_EMPTY':
      // Requirement 1.3: validation error without API call
      state = { status: 'error', message: action.payload };
      break;

    default:
      // Unknown actions are silently ignored to avoid crashes
      break;
  }

  if (renderCallback) {
    renderCallback(state);
  }
}
