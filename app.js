import { initializeRouter } from './js/router.js';
import { initializeTheme } from './js/theme.js';
import { initializeMenu } from './js/menu.js';
import { initializeServiceWorker } from './js/pwa.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  initializeMenu();
  initializeRouter();
  initializeServiceWorker();
});