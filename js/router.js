import { render as renderHome } from './pages/home.js';
import { render as renderScores } from './pages/scores.js';
import { render as renderResults } from './pages/results.js';
import { render as renderHandicaps } from './pages/handicaps.js';
import { render as renderBest14 } from './pages/best14.js';
import { render as renderLeagues } from './pages/leagues.js';
import { render as renderRSCup } from './pages/rscup.js';

const routes = {
    '/': { view: renderHome, title: 'WAGS Home', pageClass: 'index-page' },
    '/scores': { view: renderScores, title: 'WAGS Results', pageClass: 'scores-page' },
    '/results': { view: renderResults, title: 'Full Results', pageClass: 'results-page' },
    '/handicaps': { view: renderHandicaps, title: 'Player Handicaps', pageClass: 'handicaps-page' },
    '/best14': { view: renderBest14, title: 'Best 14 Rounds', pageClass: 'best14-page' },
    '/leagues': { view: renderLeagues, title: 'League Standings', pageClass: 'leagues-page' },
    '/rscup': { view: renderRSCup, title: 'RS Cup', pageClass: 'rscup-page' },
};

const navigateTo = (url) => {
    history.pushState(null, null, url);
    router();
};

const router = async () => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const app = document.getElementById('app');

    // Find a matching route
    const route = routes[path] || routes['/'];

    // --- Page Transition Logic ---
    // 1. Animate current content out (if any)
    if (app.children.length > 0) {
        await new Promise(resolve => {
            gsap.to(app, {
                x: window.innerWidth, // Slide out to the right
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => {
                    app.innerHTML = ''; // Clear content after animation
                    gsap.set(app, { clearProps: "x,opacity" }); // Reset GSAP styles
                    resolve();
                }
            });
        });
    }

    // 2. Get the HTML for the new page and render it
    app.innerHTML = await route.view(params);

    // 3. Animate new content in
    gsap.from(app, {
        x: -window.innerWidth, // Start from left
        opacity: 0,
        duration: 0.4,
        ease: "power2.out"
    });

    // Update page title
    document.title = route.title;

    // Update body class
    document.body.className = ''; // Clear previous classes
    document.body.classList.add(route.pageClass);
    // Re-apply theme class
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.classList.add(theme === 'light' ? 'light-theme' : 'dark-theme');

    // Manage controls
    updateControls(path);
};

async function updateControls(path) {
    const topControlsContainer = document.getElementById('top-controls-container');
    const bottomControlsContainer = document.getElementById('bottom-controls-container');
    topControlsContainer.innerHTML = ''; // Clear previous controls
    bottomControlsContainer.innerHTML = ''; // Clear previous controls

    const menuButtonHTML = `
        <button type="button" id="menuPillButton" class="fixed-menu-pill-button" aria-label="Open menu" aria-expanded="false" aria-controls="fullPageNav">
            <div class="burger-icon"><span></span><span></span><span></span></div>
        </button>`;

    if (path === '/results') {
        const backButtonHTML = `
            <a href="/scores" class="fixed-circle-back-button" aria-label="Go back to scores" data-link>
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
            </a>`;
        topControlsContainer.innerHTML = `<div class="top-right-controls">${backButtonHTML}</div>`;
    } else {
        // All other pages, including home, get the menu button
        topControlsContainer.innerHTML = `<div class="top-right-controls">${menuButtonHTML}</div>`;
    }
    
    if (path === '/') { // Home page specific controls
        // Add theme toggle to bottom container for home page
        const { createThemeToggle } = await import('./theme.js');
        bottomControlsContainer.appendChild(createThemeToggle());
    }
}

export function initializeRouter() {
    window.addEventListener('popstate', router);

    document.body.addEventListener('click', e => {
        if (e.target.matches('[data-link]')) {
            e.preventDefault();
            navigateTo(e.target.href);
        } else if (e.target.closest('[data-link]')) {
            e.preventDefault();
            navigateTo(e.target.closest('[data-link]').href);
        }
    });

    router();
}