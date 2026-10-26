/**
 * @fileoverview Application bootstrap — entry point.
 * Wires the State Manager render callback, initialises the SearchForm,
 * and sets the initial idle state on first load.
 *
 * Requirement references: 1.1
 */

import { setRenderCallback } from './state/store.js';
import { render } from './ui/render.js';
import { initSearchForm } from './ui/searchForm.js';
import { renderIdle } from './ui/components.js';
import { renderLoading } from './ui/components.js';

// 1. Wire the render function as the state change callback
setRenderCallback(render);

// 2. Attach SearchForm event handlers
initSearchForm();

// 3. Set initial visible state: hide both panels, no spinner (Requirement 1.1)
renderLoading(false);
renderIdle();
