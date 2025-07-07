export function applyTheme(theme) {
  const body = document.body;
  body.classList.remove('light-theme', 'dark-theme');
  body.classList.add(theme === 'light' ? 'light-theme' : 'dark-theme');
  localStorage.setItem('theme', theme);

  // The theme toggle input might not exist on the page when this is called
  // The router/page module will be responsible for creating it and setting its state.
  const themeToggleInput = document.getElementById('themeToggleInput');
  if (themeToggleInput) {
    themeToggleInput.checked = (theme === 'light');
  }
}

export function initializeTheme() {
  const storedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(storedTheme);
}

// This function can be called by a page module to create the toggle
export function createThemeToggle() {
    const container = document.createElement('div');
    container.className = 'home-theme-toggle-container';
    container.innerHTML = `
        <span class="theme-icon-wrapper" aria-hidden="true">
          <svg class="theme-icon icon-moon" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          <svg class="theme-icon icon-sun" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </span>
        <label class="theme-toggle-switch" for="themeToggleInput" aria-label="Toggle theme">
          <input type="checkbox" id="themeToggleInput" />
          <span class="slider round"></span>
        </label>
    `;
    const input = container.querySelector('#themeToggleInput');
    input.checked = (localStorage.getItem('theme') === 'light');
    input.addEventListener('change', (event) => {
      const newTheme = event.target.checked ? 'light' : 'dark';
      applyTheme(newTheme);
    });
    return container;
}