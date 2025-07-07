export function initializeMenu() {
    const fullPageNav = document.getElementById('fullPageNav');
    const closeNavButton = document.getElementById('closeNavButton');
    const body = document.body;

    if (!fullPageNav || !closeNavButton) return;

    const navLinks = fullPageNav.querySelectorAll('.nav-links a');

    // The menu button is added/removed dynamically, so we use event delegation on a static parent.
    document.getElementById('top-controls-container').addEventListener('click', (event) => {
        const button = event.target.closest('#menuPillButton');
        if (button) {
            fullPageNav.classList.add('active');
            body.style.overflow = 'hidden';
            button.setAttribute('aria-expanded', 'true');
            if (body.classList.contains('index-page')) {
                body.classList.add('nav-open');
            }
        }
    });

    const closeMenu = () => {
        const menuPillButton = document.getElementById('menuPillButton');
        fullPageNav.classList.remove('active');
        body.style.overflow = '';
        if (menuPillButton && menuPillButton.hasAttribute('aria-expanded')) {
            menuPillButton.setAttribute('aria-expanded', 'false');
        }
        if (body.classList.contains('index-page')) {
            body.classList.remove('nav-open');
        }
    };

    closeNavButton.addEventListener('click', closeMenu);

    navLinks.forEach(item => {
        item.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && fullPageNav.classList.contains('active')) {
            closeMenu();
        }
    });
}