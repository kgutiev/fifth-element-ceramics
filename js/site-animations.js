(function (global) {
  'use strict';

  const SELECTORS = '.fade-in-up, .fade-in, .scale-in';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let observer = null;

  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.92 && rect.bottom > 8;
  }

  function markVisible(el) {
    el.classList.add('visible');
    if (observer) observer.unobserve(el);
  }

  function observeAnimatedElements(root) {
    const scope = root || document;
    const elements = scope.querySelectorAll(SELECTORS);

    if (reducedMotion) {
      elements.forEach(markVisible);
      return;
    }

    if (!observer) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            markVisible(entry.target);
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
      );
    }

    elements.forEach((el) => {
      if (el.classList.contains('visible')) return;
      if (isInViewport(el)) {
        markVisible(el);
        return;
      }
      observer.observe(el);
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

  global.SiteAnimations = { observe: observeAnimatedElements, reveal: observeAnimatedElements };
})();
