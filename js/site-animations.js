(function (global) {
  'use strict';

  const SELECTORS = '.fade-in-up, .fade-in, .scale-in';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let observer = null;

  function observeAnimatedElements(root) {
    const scope = root || document;
    const elements = scope.querySelectorAll(SELECTORS);

    if (reducedMotion) {
      elements.forEach((el) => el.classList.add('visible'));
      return;
    }

    if (!observer) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );
    }

    elements.forEach((el) => {
      if (!el.classList.contains('visible')) observer.observe(el);
    });
  }

  function initHeroParallax() {
    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg || reducedMotion) return;

    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          heroBg.style.transform = `translate3d(0, ${window.scrollY * 0.35}px, 0)`;
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  function init() {
    document.documentElement.classList.add('js-anim');
    observeAnimatedElements();
    initHeroParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.SiteAnimations = { observe: observeAnimatedElements };
})();
