(function () {
  'use strict';

  function initSiteHeader() {
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
      requestAnimationFrame(() => menuClose?.focus());
    }

    function closeMenu() {
      if (!fullscreenMenu?.classList.contains('active')) return;
      fullscreenMenu.classList.remove('active');
      fullscreenMenu.setAttribute('inert', '');
      fullscreenMenu.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
      requestAnimationFrame(() => menuToggle?.focus());
    }

    function bindTap(el, handler) {
      if (!el) return;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handler();
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handler();
        }
      });
    }

    bindTap(themeBtn, () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      updateThemeIcon();
    });

    bindTap(menuToggle, openMenu);
    bindTap(menuClose, closeMenu);

    fullscreenMenu?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('scroll', () => {
      header?.classList.toggle('site-header--scrolled', window.scrollY > 10);
    }, { passive: true });

    updateThemeIcon();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteHeader);
  } else {
    initSiteHeader();
  }
})();
