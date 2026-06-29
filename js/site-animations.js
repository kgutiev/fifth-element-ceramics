(function (global) {
  'use strict';

  const SELECTORS = '.fade-in-up, .fade-in, .scale-in';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let observer = null;

  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    return rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
  }

  function markVisible(el) {
    el.classList.add('visible');
    if (observer) observer.unobserve(el);
  }

  function processElements(scope) {
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
        { threshold: 0.05, rootMargin: '0px 0px 0px 0px' }
      );
    }

    elements.forEach((el) => {
      if (el.classList.contains('visible')) return;
      if (isInViewport(el)) {
        markVisible(el);
      } else {
        observer.observe(el);
      }
    });
  }

  function observeAnimatedElements(root) {
    const scope = root || document;

    processElements(scope);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        processElements(scope);
      });
    });

    if (root) {
      setTimeout(() => {
        scope.querySelectorAll(SELECTORS).forEach((el) => {
          if (!el.classList.contains('visible')) markVisible(el);
        });
      }, 500);
    }
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
