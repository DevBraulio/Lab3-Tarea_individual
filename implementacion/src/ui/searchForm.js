/**
 * @fileoverview SearchForm event wiring.
 * Attaches `submit` and `keydown` handlers to the search form and city input.
 *
 * Requirement references: 1.2, 1.5
 */

import { searchCity } from '../state/actions.js';

/**
 * Initialises the SearchForm event listeners.
 * Must be called once after the DOM is ready.
 *
 * - submit handler: reads City_Input value and calls searchCity (Requirement 1.5).
 * - keydown handler: triggers submit on Enter key (Requirement 1.5).
 * - input constraint: maxlength=100 enforced via HTML attribute (Requirement 1.2).
 */
export function initSearchForm() {
  const form  = document.getElementById('search-form');
  const input = document.getElementById('city-input');

  // Requirement 1.5: submit on form submit event (button click or Enter)
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    searchCity(input.value);
  });

  // Requirement 1.5: pressing Enter while City_Input is focused submits the form
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      form.requestSubmit();
    }
  });
}
