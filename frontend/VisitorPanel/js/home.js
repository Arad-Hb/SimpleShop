(function (Store) {
  'use strict';

  const mediaUrl = (path) => (Store.api?.mediaUrl ? Store.api.mediaUrl(path) : path);
  const { escapeHtml } = Store.ui || {
    escapeHtml: (s) => String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  };

  const resolveLink = (link) => {
    if (!link) return 'category.html';
    if (/^https?:\/\//i.test(link)) return link;
    // Seed links may be site-root absolute (/category.html...) — map to Visitor panel files
    return link.replace(/^\//, '');
  };

  const renderHero = (banners) => {
    const carousel = document.getElementById('heroCarousel');
    if (!carousel || !banners.length) return;

    const indicators = carousel.querySelector('.carousel-indicators');
    const inner = carousel.querySelector('.carousel-inner');
    if (!indicators || !inner) return;

    indicators.innerHTML = banners.map((_, i) => `
      <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="${i}"
        class="${i === 0 ? 'active' : ''}" ${i === 0 ? 'aria-current="true"' : ''}></button>`).join('');

    inner.innerHTML = banners.map((b, i) => {
      const img = mediaUrl(b.imageUrl || b.ImageUrl || '');
      const title = escapeHtml(b.title || b.Title || '');
      const subtitle = escapeHtml(b.subtitle || b.Subtitle || '');
      const btn = escapeHtml(b.buttonText || b.ButtonText || 'مشاهده');
      const href = resolveLink(b.linkUrl || b.LinkUrl || 'category.html');
      return `
        <div class="carousel-item ${i === 0 ? 'active' : ''}">
          <div class="hero-slide has-photo" style="--hero-image:url('${img}')">
            <div class="hero-copy">
              <span class="eyebrow">پیشنهاد ویژه</span>
              <h1>${title}</h1>
              <p>${subtitle}</p>
              <a href="${escapeHtml(href)}" class="btn btn-light btn-lg">${btn}</a>
            </div>
          </div>
        </div>`;
    }).join('');
  };

  const renderSideAds = (banners) => {
    const aside = document.querySelector('.hero-side-ads');
    if (!aside || !banners.length) return;
    aside.innerHTML = banners.map((b, i) => {
      const img = mediaUrl(b.imageUrl || b.ImageUrl || '');
      const title = escapeHtml(b.title || b.Title || '');
      const subtitle = escapeHtml(b.subtitle || b.Subtitle || '');
      const href = resolveLink(b.linkUrl || b.LinkUrl || 'category.html');
      const tagClass = i === 0 ? 'tag-amazing' : 'tag-special';
      return `
        <a href="${escapeHtml(href)}" class="side-ad has-photo" style="--ad-image:url('${img}')">
          <span class="offer-tag ${tagClass}">${title}</span>
          <strong>${subtitle || title}</strong>
        </a>`;
    }).join('');
  };

  const renderAdRow = (banners) => {
    const row = document.querySelector('.ad-row');
    if (!row || !banners.length) return;
    row.innerHTML = banners.map((b) => {
      const img = mediaUrl(b.imageUrl || b.ImageUrl || '');
      const title = escapeHtml(b.title || b.Title || '');
      const subtitle = escapeHtml(b.subtitle || b.Subtitle || '');
      const href = resolveLink(b.linkUrl || b.LinkUrl || 'category.html');
      return `
        <a href="${escapeHtml(href)}" class="ad-banner has-photo" style="--ad-image:url('${img}')">
          <span>${title}</span>
          <strong>${subtitle || title}</strong>
        </a>`;
    }).join('');
  };

  const loadBanners = async () => {
    if (!Store.config?.USE_API || !Store.api?.getBanners) return;
    try {
      const all = await Store.api.getBanners();
      const list = Array.isArray(all) ? all : [];
      const by = (placement) => list
        .filter((b) => (b.placement || b.Placement) === placement)
        .sort((a, b) => (a.sortOrder || a.SortOrder || 0) - (b.sortOrder || b.SortOrder || 0));

      renderHero(by('HeroSlider'));
      renderSideAds(by('SideAd'));
      renderAdRow(by('AdRow'));
    } catch {
      // keep static HTML fallback
    }
  };

  const toFaDigits = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

  const initDealTimer = () => {
    const timer = document.getElementById('deal-timer');
    if (!timer) return;
    let total = 5 * 3600 + 40 * 60 + 10;
    const tick = () => {
      if (total <= 0) total = 12 * 3600;
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      const pad = (n) => toFaDigits(String(n).padStart(2, '0'));
      timer.innerHTML =
        `<span>${pad(h)}</span><span class="deal-timer__sep">:</span>` +
        `<span>${pad(m)}</span><span class="deal-timer__sep">:</span>` +
        `<span>${pad(s)}</span>`;
      total -= 1;
    };
    tick();
    setInterval(tick, 1000);
  };

  document.addEventListener('DOMContentLoaded', async () => {
    await Store.catalog.ready;
    await loadBanners();
    initDealTimer();

    const { productCard, bindAddButtons } = Store.ui;
    const { PRODUCTS, getAmazing, source } = Store.catalog;

    const banner = document.querySelector('.preview-banner');
    if (banner) {
      banner.textContent = source === 'api'
        ? 'متصل به API — محصولات و بنرها از سرور بارگذاری شدند'
        : 'حالت دمو — API در دسترس نیست؛ کاتالوگ محلی نمایش داده می‌شود';
    }

    const buildDeals = () => {
      const amazing = getAmazing();
      if (amazing.length >= 6) return amazing.slice(0, 6);
      const rest = PRODUCTS.filter((p) => !p.amazing && p.tag !== 'amazing');
      const merged = amazing.length ? [...amazing, ...rest] : PRODUCTS.slice();
      return merged.slice(0, 6);
    };
    const best = PRODUCTS.slice().sort((a, b) => b.reviews - a.reviews).slice(0, 5);
    const newest = PRODUCTS.slice().reverse().slice(0, 5);

    const fill = (sel, items, opts) => {
      const el = document.querySelector(sel);
      if (!el) return;
      el.innerHTML = items.map((p) => productCard(p, opts)).join('');
    };

    fill('#deals-rail', buildDeals(), { deal: true });
    fill('#best-grid', best);
    fill('#new-grid', newest);
    bindAddButtons(document);
  });
})(window.SimpleStore = window.SimpleStore || {});
