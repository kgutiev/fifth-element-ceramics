(function () {
  'use strict';

  const menuToggle = document.querySelector('.menu-toggle');
  const menuClose = document.querySelector('.menu-close');
  const fullscreenMenu = document.getElementById('fullscreen-menu');
  const header = document.getElementById('site-header');
  const themeBtn = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;

  let theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);

  function updateThemeIcon() {
    const icon = themeBtn?.querySelector('[data-theme-icon]');
    if (!themeBtn || !icon) return;
    themeBtn.setAttribute(
      'aria-label',
      'Переключить на ' + (theme === 'dark' ? 'светлую' : 'тёмную') + ' тему'
    );
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function openMenu() {
    if (!fullscreenMenu) return;
    fullscreenMenu.classList.add('active');
    fullscreenMenu.removeAttribute('inert');
    fullscreenMenu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'true');
    menuClose?.focus();
  }

  function closeMenu() {
    if (!fullscreenMenu) return;
    fullscreenMenu.classList.remove('active');
    fullscreenMenu.setAttribute('inert', '');
    fullscreenMenu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.focus();
  }

  themeBtn?.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    updateThemeIcon();
  });

  menuToggle?.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', closeMenu);

  fullscreenMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fullscreenMenu?.classList.contains('active')) {
      closeMenu();
    }
  });

  window.addEventListener('scroll', () => {
    header?.classList.toggle('site-header--scrolled', window.scrollY > 10);
  }, { passive: true });

  updateThemeIcon();
})();
