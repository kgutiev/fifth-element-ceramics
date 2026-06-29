/**
 * Shared product utilities + lightbox modal (catalog & homepage)
 */
(function (global) {
  'use strict';

  const CATEGORY_LABELS = { vases: 'Вазы', pots: 'Посуда', decor: 'Декор', all: 'Все' };

  let productsData = [];
  let currentProduct = null;
  let modalReturnFocus = null;
  let modalSlideIndex = 0;

  let modalEl, modalPanel, modalViewport, modalDots;

  function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
  }

  function normalizeMediaUrl(url) {
    if (!url || typeof url !== 'string') return '';
    return url.replace(/\.mov$/i, '.mp4');
  }

  function isSafeMediaUrl(url) {
    const normalized = normalizeMediaUrl(url);
    if (!normalized) return false;
    return /^\.\/assets\/[^\s"'<>\\]+$/.test(normalized);
  }

  function inferMediaType(item) {
    if (item.type === 'video' || item.type === 'image') return item.type;
    const src = normalizeMediaUrl(item.src || item.url || '');
    return /\.(mp4|webm|mov)$/i.test(src) ? 'video' : 'image';
  }

  function normalizeMediaItem(item) {
    const src = normalizeMediaUrl(item.src || item.url || '');
    if (!isSafeMediaUrl(src)) return null;
    return { type: inferMediaType({ ...item, src }), src };
  }

  function normalizeMedia(product) {
    if (Array.isArray(product.media) && product.media.length) {
      return product.media.map(normalizeMediaItem).filter(Boolean);
    }
    if (product.image && isSafeMediaUrl(product.image)) {
      return [{ type: 'image', src: normalizeMediaUrl(product.image) }];
    }
    return [];
  }

  function renderVideoTag(attrs, src, w, h) {
    const safeSrc = escapeAttr(src);
    const width = w || 570;
    const height = h || 760;
    return `<video ${attrs} muted playsinline loop preload="metadata" loading="lazy" width="${width}" height="${height}"><source src="${safeSrc}" type="video/mp4"></video>`;
  }

  function renderSingleMedia(item, title, autoplay) {
    const src = item.src;
    const alt = escapeAttr(title);
    if (item.type === 'video') {
      return renderVideoTag(autoplay ? 'autoplay' : '', src);
    }
    return `<img src="${escapeAttr(src)}" alt="${alt}" loading="lazy" decoding="async" width="570" height="760">`;
  }

  function renderMediaSlide(m, title, active, prefix) {
    const src = m.src;
    const alt = escapeAttr(title);
    const cls = prefix + '__media' + (active ? ' is-active' : '');
    const isModal = prefix === 'product-modal';
    const w = isModal ? 800 : 570;
    const h = isModal ? 800 : 760;
    if (m.type === 'video') {
      return renderVideoTag(`class="${cls}"${active ? ' autoplay' : ''}`, src, w, h);
    }
    return `<img class="${cls}" src="${escapeAttr(src)}" alt="${alt}" loading="lazy" decoding="async" width="${w}" height="${h}">`;
  }

  function renderProductCard(p, index, options) {
    const opts = options || {};
    const media = normalizeMedia(p);
    const cat = escapeAttr(p.category || 'all');
    const title = escapeHtml(p.title);
    const info = escapeHtml(p.info);
    const price = Number(p.price).toLocaleString('ru-RU');
    const status = p.status ? `<span class="product-card-tag">${escapeHtml(p.status)}</span>` : '';
    const size = p.height ? `<p class="product-card-size">📐 ${escapeHtml(p.height)}</p>` : '';
    const indexAttr = opts.useTitle
      ? `data-product-title="${escapeAttr(p.title)}"`
      : `data-product-index="${index}"`;

    let imageBlock;
    if (media.length > 1) {
      const slides = media.map((m, i) => renderMediaSlide(m, p.title, i === 0, 'product-gallery')).join('');
      const dots = media.map((_, i) =>
        `<button type="button" class="product-gallery__dot${i === 0 ? ' is-active' : ''}" role="tab" aria-selected="${i === 0}" aria-label="Слайд ${i + 1} из ${media.length}" data-index="${i}"></button>`
      ).join('');
      imageBlock = `
        <div class="product-card-image">
          <div class="product-gallery" data-gallery tabindex="-1" aria-roledescription="carousel" aria-label="Галерея: ${escapeAttr(p.title)}">
            <div class="product-gallery__viewport">${slides}</div>
            <div class="product-gallery__dots" role="tablist">${dots}</div>
          </div>
        </div>`;
    } else if (media.length === 1) {
      imageBlock = `<div class="product-card-image">${renderSingleMedia(media[0], p.title, media[0].type === 'video')}</div>`;
    } else {
      imageBlock = `<div class="product-card-image product-card-image--empty" aria-hidden="true"></div>`;
    }

    const hint = opts.showHint === false ? '' : `
      <p class="product-card-hint">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Нажмите для просмотра
      </p>`;

    const delayClass = 'delay-' + ((index % 4) + 1);

    return `
      <article class="product-card fade-in-up ${delayClass}" data-category="${cat}" ${indexAttr} tabindex="0" role="button" aria-label="Открыть: ${escapeAttr(p.title)}">
        ${imageBlock}
        <div class="product-card-body">
          <h3 class="product-card-title">${title}</h3>
          <p class="product-card-info product-card-info--clamped">${info}</p>
          ${size}
          <p class="product-card-price">${price} ₽</p>
          ${status}
          ${hint}
        </div>
      </article>`;
  }

  function initGalleries(root) {
    const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    (root || document).querySelectorAll('[data-gallery]').forEach(gallery => {
      if (gallery.dataset.bound) return;
      gallery.dataset.bound = 'true';
      const items = gallery.querySelectorAll('.product-gallery__media');
      const dots = gallery.querySelectorAll('.product-gallery__dot');
      if (!items.length) return;

      let current = 0;
      let autoTimer = null;

      function showSlide(index) {
        if (index === current && items[index]?.classList.contains('is-active')) return;
        const prevIndex = current;
        current = index;

        items.forEach((el, i) => {
          if (i === index) {
            el.classList.add('is-active');
            el.classList.remove('is-prev');
            if (el.tagName === 'VIDEO') el.play().catch(() => {});
          } else if (i === prevIndex) {
            el.classList.remove('is-active');
            el.classList.add('is-prev');
            if (el.tagName === 'VIDEO') {
              el.pause();
              el.currentTime = 0;
            }
            window.setTimeout(() => el.classList.remove('is-prev'), 520);
          } else {
            el.classList.remove('is-active', 'is-prev');
            if (el.tagName === 'VIDEO') {
              el.pause();
              el.currentTime = 0;
            }
          }
        });

        dots.forEach((dot, i) => {
          dot.classList.toggle('is-active', i === index);
          dot.setAttribute('aria-selected', String(i === index));
        });
      }

      function stopAuto() {
        if (autoTimer) {
          clearInterval(autoTimer);
          autoTimer = null;
        }
      }

      function startAuto() {
        if (items.length <= 1 || prefersReduced) return;
        stopAuto();
        autoTimer = setInterval(() => {
          if (gallery.matches(':hover') || gallery.matches(':focus-within')) return;
          showSlide((current + 1) % items.length);
        }, 4000);
      }

      dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          showSlide(Number(dot.dataset.index));
          stopAuto();
          startAuto();
        });
      });

      gallery.addEventListener('keydown', (e) => {
        const idx = [...items].findIndex(el => el.classList.contains('is-active'));
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          showSlide((idx + 1) % items.length);
          stopAuto();
          startAuto();
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          showSlide((idx - 1 + items.length) % items.length);
          stopAuto();
          startAuto();
        }
      });

      gallery.addEventListener('mouseenter', stopAuto);
      gallery.addEventListener('mouseleave', startAuto);
      gallery.addEventListener('focusin', stopAuto);
      gallery.addEventListener('focusout', (e) => {
        if (!gallery.contains(e.relatedTarget)) startAuto();
      });

      startAuto();
    });
  }

  function setModalSlide(index, media) {
    if (!modalViewport) return;
    const items = modalViewport.querySelectorAll('.product-modal__media');
    const prevIndex = modalSlideIndex;
    modalSlideIndex = index;

    items.forEach((el, i) => {
      if (i === index) {
        el.classList.add('is-active');
        el.classList.remove('is-prev');
        if (el.tagName === 'VIDEO') el.play().catch(() => {});
      } else if (i === prevIndex) {
        el.classList.remove('is-active');
        el.classList.add('is-prev');
        if (el.tagName === 'VIDEO') {
          el.pause();
          el.currentTime = 0;
        }
        window.setTimeout(() => el.classList.remove('is-prev'), 520);
      } else {
        el.classList.remove('is-active', 'is-prev');
        if (el.tagName === 'VIDEO') {
          el.pause();
          el.currentTime = 0;
        }
      }
    });

    const dots = modalDots?.querySelectorAll('.product-modal__dot') || [];
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-selected', String(i === index));
    });
    const prevBtn = modalEl?.querySelector('[data-modal-prev]');
    const nextBtn = modalEl?.querySelector('[data-modal-next]');
    if (prevBtn) prevBtn.style.visibility = media.length > 1 ? 'visible' : 'hidden';
    if (nextBtn) nextBtn.style.visibility = media.length > 1 ? 'visible' : 'hidden';
    if (modalDots) modalDots.style.display = media.length > 1 ? 'flex' : 'none';
  }

  function buildModalGallery(media, title) {
    if (!modalViewport || !modalDots) return;
    modalViewport.innerHTML = media.map((m, i) => renderMediaSlide(m, title, i === 0, 'product-modal')).join('');
    modalDots.innerHTML = media.map((_, i) =>
      `<button type="button" class="product-modal__dot product-gallery__dot${i === 0 ? ' is-active' : ''}" role="tab" aria-selected="${i === 0}" aria-label="Слайд ${i + 1} из ${media.length}" data-index="${i}"></button>`
    ).join('');
    modalDots.querySelectorAll('.product-modal__dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        setModalSlide(Number(dot.dataset.index), media);
      });
    });
    setModalSlide(0, media);
  }

  function trapModalFocus(e) {
    if (e.key !== 'Tab' || !modalPanel) return;
    const focusable = modalPanel.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function setStatusBadge(statusEl, status) {
    if (!statusEl) return;
    statusEl.className = 'product-modal__status';
    if (!status) {
      statusEl.hidden = true;
      return;
    }
    statusEl.textContent = status;
    statusEl.hidden = false;
    if (status === 'В наличии') statusEl.classList.add('product-modal__status--available');
    else if (status === 'Продано') statusEl.classList.add('product-modal__status--sold');
    else if (status === 'Под заказ') statusEl.classList.add('product-modal__status--order');
    else statusEl.classList.add('product-modal__status--default');
  }

  function openProductModalWithProduct(product) {
    if (!product || !modalEl) return;
    currentProduct = product;
    const media = normalizeMedia(product);
    modalReturnFocus = document.activeElement;

    modalEl.querySelector('[data-modal-title]').textContent = product.title;
    modalEl.querySelector('[data-modal-description]').textContent = product.info || '';
    modalEl.querySelector('[data-modal-price]').textContent = Number(product.price).toLocaleString('ru-RU') + ' ₽';

    const catText = CATEGORY_LABELS[product.category] || product.category || '';
    const catWrap = modalEl.querySelector('[data-modal-category-wrap]');
    const catEl = modalEl.querySelector('[data-modal-category]');
    const heightWrap = modalEl.querySelector('[data-modal-height-wrap]');
    const heightEl = modalEl.querySelector('[data-modal-height]');
    const metaEl = modalEl.querySelector('[data-modal-meta]');

    if (catEl && catWrap) {
      if (catText) {
        catEl.textContent = catText;
        catWrap.hidden = false;
      } else {
        catWrap.hidden = true;
      }
    }

    if (heightEl && heightWrap) {
      if (product.height) {
        heightEl.textContent = product.height;
        heightWrap.hidden = false;
      } else {
        heightWrap.hidden = true;
      }
    }

    if (metaEl) {
      metaEl.hidden = !catText && !product.height;
    }

    setStatusBadge(modalEl.querySelector('[data-modal-status]'), product.status);

    if (media.length) buildModalGallery(media, product.title);
    else if (modalViewport) modalViewport.innerHTML = '<div class="product-modal__empty">Нет изображения</div>';

    modalEl.hidden = false;
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => modalEl.classList.add('is-open'));
    modalEl.querySelector('.product-modal__close')?.focus();
    document.addEventListener('keydown', onModalKeydown);
  }

  function openProductModal(index) {
    const product = productsData[index];
    if (product) openProductModalWithProduct(product);
  }

  function openProductModalByTitle(title) {
    const normalized = normalizeTitle(title);
    const fromCatalog = productsData.find((p) => normalizeTitle(p.title) === normalized);
    if (fromCatalog) {
      openProductModalWithProduct(fromCatalog);
      return;
    }
    const fromFeatured = (global.featuredProducts || []).find(
      (p) => normalizeTitle(p.title) === normalized
    );
    if (fromFeatured) openProductModalWithProduct(fromFeatured);
  }

  function closeProductModal() {
    if (!modalEl || modalEl.hidden) return;
    currentProduct = null;
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onModalKeydown);
    modalViewport?.querySelectorAll('video').forEach(v => { v.pause(); });
    setTimeout(() => { modalEl.hidden = true; }, 250);
    if (modalReturnFocus?.focus) modalReturnFocus.focus();
  }

  function onModalKeydown(e) {
    const media = currentProduct ? normalizeMedia(currentProduct) : [];

    if (e.key === 'Escape') { e.preventDefault(); closeProductModal(); return; }
    if (e.key === 'ArrowRight' && media.length > 1) {
      e.preventDefault();
      setModalSlide((modalSlideIndex + 1) % media.length, media);
    }
    if (e.key === 'ArrowLeft' && media.length > 1) {
      e.preventDefault();
      setModalSlide((modalSlideIndex - 1 + media.length) % media.length, media);
    }
    trapModalFocus(e);
  }

  function initModalSwipe() {
    if (!modalViewport || modalViewport.dataset.swipeBound) return;
    modalViewport.dataset.swipeBound = 'true';
    let touchStartX = 0;
    modalViewport.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    modalViewport.addEventListener('touchend', (e) => {
      const m = currentProduct ? normalizeMedia(currentProduct) : [];
      if (m.length < 2) return;
      const diff = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(diff) < 50) return;
      if (diff < 0) setModalSlide((modalSlideIndex + 1) % m.length, m);
      else setModalSlide((modalSlideIndex - 1 + m.length) % m.length, m);
    }, { passive: true });
  }

  function initProductModal(containerSelector, dataAttr) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const attr = dataAttr || 'data-product-index';
    container.querySelectorAll('.product-card[' + attr + ']').forEach(card => {
      if (card.dataset.modalBound) return;
      card.dataset.modalBound = 'true';

      const open = () => {
        if (attr === 'data-product-title') {
          openProductModalByTitle(card.getAttribute('data-product-title'));
        } else {
          openProductModal(Number(card.getAttribute('data-product-index')));
        }
      };

      card.addEventListener('click', (e) => {
        if (e.target.closest('.product-gallery__dot')) return;
        open();
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
  }

  function initModalElement() {
    modalEl = document.getElementById('product-modal');
    if (!modalEl || modalEl.dataset.initialized) return;
    modalEl.dataset.initialized = 'true';

    modalPanel = modalEl.querySelector('.product-modal__panel');
    modalViewport = modalEl.querySelector('[data-modal-viewport]');
    modalDots = modalEl.querySelector('[data-modal-dots]');

    modalEl.querySelectorAll('[data-modal-close]').forEach(el => {
      el.addEventListener('click', closeProductModal);
    });
    modalEl.querySelector('[data-modal-prev]')?.addEventListener('click', () => {
      const m = currentProduct ? normalizeMedia(currentProduct) : [];
      if (m.length) setModalSlide((modalSlideIndex - 1 + m.length) % m.length, m);
    });
    modalEl.querySelector('[data-modal-next]')?.addEventListener('click', () => {
      const m = currentProduct ? normalizeMedia(currentProduct) : [];
      if (m.length) setModalSlide((modalSlideIndex + 1) % m.length, m);
    });
    modalEl.querySelector('.product-modal__backdrop')?.addEventListener('click', closeProductModal);
    modalViewport?.addEventListener('click', () => {
      const m = currentProduct ? normalizeMedia(currentProduct) : [];
      if (m.length > 1) setModalSlide((modalSlideIndex + 1) % m.length, m);
    });
    initModalSwipe();
  }

  function normalizeTitle(str) {
    return (str || '')
      .replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function findProduct(catalog, item) {
    if (!item) return null;
    if (item.id) {
      const byId = catalog.find((p) => p.id === item.id);
      if (byId) return byId;
    }
    const title = normalizeTitle(item.title);
    return catalog.find((p) => normalizeTitle(p.title) === title) || null;
  }

  function pickMedia(featuredItem, catalogItem) {
    const fMedia = featuredItem?.media || [];
    const cMedia = catalogItem?.media || [];
    if (fMedia.length && cMedia.length) {
      return fMedia.length >= cMedia.length ? fMedia : cMedia;
    }
    return fMedia.length ? fMedia : cMedia;
  }

  function mergeFeaturedWithCatalog(featured, catalog) {
    return featured.map((f) => {
      const full = findProduct(catalog, f);
      if (!full) return f;
      const media = pickMedia(f, full);
      return {
        ...full,
        ...f,
        id: full.id || f.id,
        media: media.length ? media : full.media || f.media,
        image: f.image || full.image
      };
    });
  }

  function resolveFeatured(homepage, catalog) {
    let featured = homepage?.featured || [];
    let isFallback = false;

    if (featured.length) {
      featured = mergeFeaturedWithCatalog(featured, catalog).filter(
        (p) => normalizeMedia(p).length > 0
      );
    }

    if (!featured.length && catalog.length) {
      featured = catalog.filter((p) => normalizeMedia(p).length > 0).slice(0, 3);
      isFallback = true;
    }

    return { featured, isFallback };
  }

  function setProducts(products) {
    productsData = products || [];
    global.productsData = productsData;
  }

  global.ProductCatalog = {
    CATEGORY_LABELS,
    escapeHtml,
    escapeAttr,
    normalizeMediaUrl,
    normalizeMedia,
    renderProductCard,
    initGalleries,
    initModalElement,
    initProductModal,
    openProductModal,
    openProductModalByTitle,
    openProductModalWithProduct,
    closeProductModal,
    setProducts,
    mergeFeaturedWithCatalog,
    resolveFeatured
  };
})(window);
