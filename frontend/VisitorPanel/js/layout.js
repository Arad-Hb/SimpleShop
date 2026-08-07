/**
 * layout.js — shared Visitor shell (header, mega menu, footer)
 *
 * Responsibility: HTML chrome only. Catalog, card, and product logic live in store-core.js.
 * Each page includes:
 *   <div id="store-header"></div> … <div id="store-footer"></div>
 *   <script src="js/store-core.js"></script>
 *   <script src="js/layout.js"></script>
 */
(function (Store) {
  'use strict';

  // ─── Shop defaults (override via localStorage branding) ─────────────
  const SITE = window.SimpleShopSite || {
    name: 'فروشگاه ساده تحلیل داده',
    tagline: 'فروشگاه اینترنتی آموزشی',
    footerTagline: 'خرید مطمئن، ارسال سریع',
    description: 'فروشگاه اینترنتی آموزشی فروشگاه ساده تحلیل داده.',
    previewBanner: 'فروشگاه آزمایشی — فروشگاه ساده تحلیل داده',
    logoPath: 'shared/assets/img/tahlildadeh-logo.png'
  };

  const SHOP = {
    name: SITE.name,
    tagline: SITE.tagline,
    footerTagline: SITE.footerTagline,
    description: SITE.description,
    previewBanner: SITE.previewBanner,
    logoUrl: '../shared/assets/img/tahlildadeh-logo.png',
    brandingKey: 'simpleShopPublicBranding',
    contact: {
      supportPhone: '09905283471',
      managerPhone: '09039737027',
      email: 'tahlildadehins@gmail.com',
      address:
        'تهران - خیابان شریعتی - بالاتر از متروی بهار شیراز - روبروی اتاق اصناف - جنب داروخانه ستارگان - پلاک 561 - طبقه2 - واحد7'
    },
    socialLinks: [
      { href: 'https://www.instagram.com/tahlildadeh', label: 'اینستاگرام', icon: 'bi-instagram' },
      { href: 'https://www.linkedin.com/company/%D8%A2%D9%85%D9%88%D8%B2%D8%B4%DA%AF%D8%A7%D9%87-%D8%AA%D8%AD%D9%84%DB%8C%D9%84-%D8%AF%D8%A7%D8%AF%D9%87/about/', label: 'لینکدین', icon: 'bi-linkedin' },
      { href: 'https://t.me/TahlildadehAcademy', label: 'تلگرام', icon: 'bi-telegram' },
      { href: 'https://www.youtube.com/user/tahlildadeh', label: 'یوتیوب', icon: 'bi-youtube' },
      { href: 'https://wa.me/989905283471', label: 'واتساپ', icon: 'bi-whatsapp' },
      { href: 'https://www.aparat.com/tahlildadeh1', label: 'آپارات', icon: 'bi-play-circle' },
      { href: 'https://web.bale.ai/chat?uid=2008118263', label: 'بله', icon: 'bi-chat-dots' }
    ]
  };

  // Demo categories shown until store-core.js refreshes nav from API
  const DEMO_CATEGORIES = [
    { id: 'digital', name: 'کالای دیجیتال', icon: 'bi-phone' },
    { id: 'home', name: 'خانه و آشپزخانه', icon: 'bi-house' },
    { id: 'fashion', name: 'مد و پوشاک', icon: 'bi-handbag' },
    { id: 'beauty', name: 'زیبایی و سلامت', icon: 'bi-flower1' },
    { id: 'sport', name: 'ورزش و سفر', icon: 'bi-trophy' },
    { id: 'gaming', name: 'گیمینگ', icon: 'bi-controller' }
  ];

  const categoryLink = (id) => `category.html?id=${encodeURIComponent(id)}`;

  // ─── HTML builders (small, named pieces) ───────────────────────────

  function renderPreviewBanner() {
    return `<div class="preview-banner">${SHOP.previewBanner}</div>`;
  }

  function renderBrandBlock(subtitle) {
    return `
      <a href="index.html" class="brand brand--tahlil" data-store-brand>
        <span class="brand-mark brand-mark--logo has-logo" data-brand-mark>
          <img src="${SHOP.logoUrl}" alt="${SHOP.name}" class="brand-logo-img" width="120" height="56">
        </span>
        <span class="brand-text">
          <strong data-brand-name>${SHOP.name}</strong>
          <small data-brand-tagline>${subtitle}</small>
        </span>
      </a>`;
  }

  function renderSearchForm() {
    return `
      <form class="search-box search-box--minimal" role="search" data-store-search>
        <input type="search" name="q" placeholder="جستجو..." aria-label="جستجو">
        <button type="submit" class="btn-search" aria-label="جستجو"><i class="bi bi-search" aria-hidden="true"></i></button>
      </form>`;
  }

  function renderHeaderActions() {
    return `
      <div class="header-actions">
        <div class="header-actions-group">
          <a href="auth.html" class="header-auth-btn">
            <span class="header-auth-text">ورود <span class="header-auth-sep">|</span> ثبت‌نام</span>
            <span class="header-auth-icon" aria-hidden="true"><i class="bi bi-box-arrow-in-left"></i></span>
          </a>
          <span class="header-actions-divider" aria-hidden="true"></span>
          <div class="header-cart-wrap">
            <button type="button" class="header-cart-btn" id="header-cart-toggle"
                    aria-expanded="false" aria-controls="header-mini-cart" aria-label="سبد خرید">
              <i class="bi bi-cart3" aria-hidden="true"></i>
              <span class="cart-badge" data-card-count data-cart-count>0</span>
            </button>
            <div class="mini-cart" id="header-mini-cart" aria-hidden="true"></div>
          </div>
        </div>
      </div>`;
  }

  function renderMainHeader() {
    return `
      <header class="main-header">
        <div class="container-xxl">
          <div class="header-row">
            ${renderBrandBlock(SHOP.tagline)}
            ${renderSearchForm()}
            ${renderHeaderActions()}
          </div>
        </div>
      </header>`;
  }

  function renderMegaCategoryList() {
    return DEMO_CATEGORIES.map((c, i) => `
      <a class="mega-cat${i === 0 ? ' active' : ''}" href="${categoryLink(c.id)}" data-panel="${c.id}">
        <i class="bi ${c.icon}"></i> ${c.name}
      </a>`).join('');
  }

  function renderMegaSubPanel(id, title, links) {
    const hidden = id === 'digital' ? '' : ' d-none';
    const items = links.map((l) => `<a href="${l.href}">${l.label}</a>`).join('');
    return `
      <div class="mega-col links${hidden}" id="mega-panel-${id}">
        <h6>${title}</h6>
        ${items}
      </div>`;
  }

  function renderMegaNav() {
    const subPanels = [
      renderMegaSubPanel('digital', 'پیشنهادها', [
        { href: categoryLink('digital'), label: 'همه کالای دیجیتال' },
        { href: 'search.html?q=گوشی', label: 'گوشی موبایل' },
        { href: 'search.html?q=لپ‌تاپ', label: 'لپ‌تاپ' },
        { href: 'search.html?q=هدفون', label: 'هدفون' }
      ]),
      renderMegaSubPanel('home', 'خانه', [
        { href: categoryLink('home'), label: 'همه خانه و آشپزخانه' },
        { href: 'search.html?q=قهوه', label: 'قهوه‌ساز' },
        { href: 'search.html?q=جارو', label: 'جارو رباتیک' }
      ]),
      renderMegaSubPanel('fashion', 'مد', [
        { href: categoryLink('fashion'), label: 'همه مد و پوشاک' },
        { href: 'search.html?q=مانتو', label: 'مانتو' },
        { href: 'search.html?q=کفش', label: 'کفش ورزشی' }
      ]),
      renderMegaSubPanel('beauty', 'زیبایی', [
        { href: categoryLink('beauty'), label: 'همه زیبایی و سلامت' },
        { href: 'search.html?q=عطر', label: 'عطر' },
        { href: 'search.html?q=کرم', label: 'مراقبت پوست' }
      ]),
      renderMegaSubPanel('sport', 'ورزش', [
        { href: categoryLink('sport'), label: 'همه ورزش و سفر' }
      ]),
      renderMegaSubPanel('gaming', 'گیمینگ', [
        { href: categoryLink('gaming'), label: 'همه گیمینگ' },
        { href: 'search.html?q=کنسول', label: 'کنسول بازی' }
      ])
    ].join('');

    return `
      <nav class="mega-nav">
        <div class="container-xxl">
          <ul class="mega-nav-list">
            <li class="mega-item">
              <a href="category.html" class="mega-trigger">
                <i class="bi bi-list" aria-hidden="true"></i>
                <span>دسته‌بندی کالاها</span>
              </a>
              <div class="mega-panel">
                <div class="mega-cols">
                  <div class="mega-col categories">${renderMegaCategoryList()}</div>
                  ${subPanels}
                  <div class="mega-col promo">
                    <div class="mega-promo-card">
                      <span class="offer-tag tag-amazing">پیشنهاد شگفت‌انگیز</span>
                      <strong>تا ۴۰٪ تخفیف کالای دیجیتال</strong>
                      <a href="category.html?tag=amazing">مشاهده همه</a>
                    </div>
                  </div>
                </div>
              </div>
            </li>
            <li class="mega-nav-divider" aria-hidden="true"></li>
            <li><a href="category.html?tag=amazing" class="mega-nav-link"><i class="bi bi-percent" aria-hidden="true"></i><span>شگفت‌انگیزها</span></a></li>
            <li><a href="category.html" class="mega-nav-link"><i class="bi bi-basket2" aria-hidden="true"></i><span>پرفروش‌ترین‌ها</span></a></li>
            <li><a href="category.html?tag=sale" class="mega-nav-link"><i class="bi bi-tags" aria-hidden="true"></i><span>تخفیف‌ها</span></a></li>
          </ul>
        </div>
      </nav>`;
  }

  function renderHeaderShell() {
    return renderPreviewBanner() + renderMainHeader() + renderMegaNav();
  }

  function renderFooterLinkColumn(title, links) {
    const items = links.map((l) => `<a href="${l.href}">${l.label}</a>`).join('');
    return `
      <div class="footer-col footer-links">
        <h5>${title}</h5>
        ${items}
      </div>`;
  }

  function renderFooterSocialMedia() {
    return `
      <div class="socialmedia-footer">
        ${SHOP.socialLinks.map((item) => `
          <a href="${item.href}" target="_blank" rel="noopener noreferrer" aria-label="${item.label}" title="${item.label}">
            <i class="bi ${item.icon}"></i>
          </a>`).join('')}
      </div>`;
  }

  function renderFooterBrandColumn() {
    return `
      <div class="footer-col footer-brand">
        <div class="brand brand--tahlil" data-store-brand>
          <span class="brand-mark brand-mark--logo has-logo" data-brand-mark>
            <img src="${SHOP.logoUrl}" alt="${SHOP.name}" class="brand-logo-img" width="100" height="48">
          </span>
          <span class="brand-text">
            <strong data-brand-name>${SHOP.name}</strong>
            <small data-brand-tagline>${SHOP.footerTagline}</small>
          </span>
        </div>
        <p data-brand-desc>${SHOP.description}</p>
        ${renderFooterSocialMedia()}
      </div>`;
  }

  function renderFooterContactColumn() {
    const { supportPhone, managerPhone, email, address } = SHOP.contact;
    return `
      <div class="footer-col footer-contact">
        <h5>ارتباط با ما</h5>
        <p><i class="bi bi-telephone"></i> شماره پشتیبانی: ${supportPhone}<br>مدیریت: ${managerPhone}</p>
        <p><i class="bi bi-envelope"></i> ایمیل: ${email}</p>
        <p><i class="bi bi-geo-alt"></i> آدرس: ${address}</p>
      </div>`;
  }

  function renderFooterShell() {
    return `
      <footer class="site-footer">
        <div class="container-xxl">
          <div class="footer-top">
            ${renderFooterBrandColumn()}
            ${renderFooterLinkColumn('با ' + SHOP.name, [
              { href: 'index.html', label: 'صفحه اصلی' },
              { href: 'category.html', label: 'محصولات' },
              { href: 'auth.html', label: 'ورود' },
              { href: 'card.html', label: 'کارت خرید' }
            ])}
            ${renderFooterLinkColumn('خدمات مشتریان', [
              { href: '#', label: 'پرسش‌های متداول' },
              { href: '#', label: 'بازگشت کالا' },
              { href: '#', label: 'شرایط استفاده' },
              { href: '../CustomerPanel/orders.html', label: 'پیگیری سفارش' },
              { href: 'auth.html', label: 'پشتیبانی' }
            ])}
            ${renderFooterContactColumn()}
          </div>
          <div class="footer-bottom">
            <span>© ۱۴۰۴ ${SHOP.name} — همه حقوق محفوظ است</span>
            <span class="preview-note">Visitor UI preview</span>
          </div>
        </div>
      </footer>`;
  }

  // ─── Branding from Admin settings (localStorage) ───────────────────

  function readBranding() {
    try {
      return JSON.parse(localStorage.getItem(SHOP.brandingKey) || 'null');
    } catch {
      return null;
    }
  }

  function applyBranding() {
    const branding = readBranding();
    if (!branding) return;

    const name = (branding.shopName || '').trim();
    const desc = (branding.shopDescription || '').trim();
    const logo = branding.logoDataUrl;

    if (name) {
      document.querySelectorAll('[data-brand-name]').forEach((el) => {
        el.textContent = name;
      });
    }

    if (desc) {
      document.querySelectorAll('[data-brand-desc]').forEach((el) => {
        el.textContent = desc;
      });
    }

    document.querySelectorAll('[data-brand-mark]').forEach((mark) => {
      if (logo) {
        mark.classList.add('has-logo', 'brand-mark--logo');
        mark.innerHTML = `<img src="${logo}" alt="${name || SHOP.name}" class="brand-logo-img">`;
      } else {
        mark.classList.add('has-logo', 'brand-mark--logo');
        mark.innerHTML = `<img src="${SHOP.logoUrl}" alt="${name || SHOP.name}" class="brand-logo-img">`;
      }
    });
  }

  // ─── Interactions (bound once after mount) ───────────────────────

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function refreshMegaSubPanels(categories) {
    const container = document.querySelector('.mega-cols');
    if (!container || !Array.isArray(categories) || !categories.length) return;

    container.querySelectorAll('.mega-col.links').forEach((el) => el.remove());

    const promoCol = container.querySelector('.mega-col.promo');
    if (!promoCol) return;

    const panels = categories.slice(0, 8).map((c, i) => {
      const id = escapeHtml(String(c.id));
      const name = escapeHtml(c.name || 'دسته');
      const hidden = i === 0 ? '' : ' d-none';
      return `
        <div class="mega-col links${hidden}" id="mega-panel-${id}">
          <h6>${name}</h6>
          <a href="${categoryLink(c.id)}">همه ${name}</a>
          <a href="search.html">جستجو در فروشگاه</a>
        </div>`;
    }).join('');

    promoCol.insertAdjacentHTML('beforebegin', panels);

    const catCol = container.querySelector('.mega-col.categories');
    if (catCol) delete catCol.dataset.megaBound;
    initMegaMenuHover();
  }

  function initMegaMenuHover() {
    const catCol = document.querySelector('.mega-col.categories');
    if (!catCol || catCol.dataset.megaBound === '1') return;
    catCol.dataset.megaBound = '1';

    catCol.addEventListener('mouseover', (event) => {
      const item = event.target.closest('.mega-cat');
      if (!item || !catCol.contains(item)) return;

      catCol.querySelectorAll('.mega-cat').forEach((el) => el.classList.remove('active'));
      item.classList.add('active');

      const panelId = item.dataset.panel;
      document.querySelectorAll('.mega-col.links').forEach((col) => {
        col.classList.toggle('d-none', col.id !== `mega-panel-${panelId}`);
      });
    });
  }

  function initSearchForms() {
    document.querySelectorAll('[data-store-search]').forEach((form) => {
      if (form.dataset.searchBound === '1') return;
      form.dataset.searchBound = '1';
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = form.querySelector('input[type="search"], input[name="q"]');
        const query = (input?.value || '').trim();
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
      });
    });
  }

  function syncCardBadge() {
    Store.card?.updateCardUI?.();
  }

  const getRowOldUnit = (row) => {
    const product = Store.catalog?.getProduct?.(row.productId);
    if (product?.old) return product.old;
    if (row.discount > 0 && row.unitPrice) {
      return Math.round(row.unitPrice / (1 - row.discount / 100));
    }
    return null;
  };

  const formatPriceNumber = (n) => Number(n || 0).toLocaleString('fa-IR');

  const renderMiniCartItem = (row) => {
    const oldUnit = getRowOldUnit(row);
    const hasDiscount = oldUnit && oldUnit > row.unitPrice;
    const discountPct = hasDiscount
      ? Math.round((1 - row.unitPrice / oldUnit) * 100)
      : (row.discount || 0);
    const thumb = row.imageUrl
      ? `<img src="${escapeHtml(row.imageUrl)}" alt="">`
      : `<i class="bi ${escapeHtml(row.icon || 'bi-box-seam')}"></i>`;

    return `
      <div class="mini-cart-item" data-mini-cart-item="${escapeHtml(row.productId)}">
        <div class="mini-cart-item-thumb">${thumb}</div>
        <div class="mini-cart-item-body">
          <a href="product.html?id=${encodeURIComponent(row.productId)}" class="mini-cart-item-title">${escapeHtml(row.title)}</a>
          <div class="mini-cart-item-qty">
            <button type="button" class="mini-cart-qty-btn mini-cart-qty-remove" data-mini-remove="${escapeHtml(row.productId)}" aria-label="حذف">
              <i class="bi bi-trash3" aria-hidden="true"></i>
            </button>
            <span class="mini-cart-qty-value">${row.quantity.toLocaleString('fa-IR')}</span>
            <button type="button" class="mini-cart-qty-btn mini-cart-qty-add" data-mini-add="${escapeHtml(row.productId)}" aria-label="افزایش">
              <i class="bi bi-plus-lg" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div class="mini-cart-item-price">
          ${hasDiscount || discountPct ? `
            <div class="mini-cart-item-price-top">
              <span class="mini-cart-price-old">${formatPriceNumber(oldUnit * row.quantity)}</span>
              <span class="mini-cart-discount-badge">${discountPct}%</span>
            </div>` : ''}
          <div class="mini-cart-price-now">
            <span class="mini-cart-price-amount">${formatPriceNumber(row.lineTotal)}</span>
            <span class="mini-cart-price-unit">تومان</span>
          </div>
        </div>
      </div>`;
  };

  const renderMiniCart = () => {
    const panel = document.getElementById('header-mini-cart');
    if (!panel) return;

    const entity = Store.card?.getCardEntity?.() || { cardItems: [], itemsTotal: 0 };
    const items = entity.cardItems || [];
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const total = entity.itemsTotal || 0;

    let totalOld = 0;
    items.forEach((row) => {
      const oldUnit = getRowOldUnit(row);
      totalOld += (oldUnit && oldUnit > row.unitPrice ? oldUnit : row.unitPrice) * row.quantity;
    });
    const totalDiscount = totalOld > total ? Math.round((1 - total / totalOld) * 100) : 0;

    if (!items.length) {
      panel.innerHTML = `
        <div class="mini-cart-empty">
          <i class="bi bi-cart3" aria-hidden="true"></i>
          <p>سبد خرید شما خالی است</p>
          <a href="category.html" class="mini-cart-empty-link">مشاهده محصولات</a>
        </div>`;
      return;
    }

    panel.innerHTML = `
      <div class="mini-cart-header">
        <span class="mini-cart-header-title">خلاصه سبد خرید شما</span>
        <span class="mini-cart-header-count">${count.toLocaleString('fa-IR')} کالا</span>
      </div>
      <div class="mini-cart-items">${items.map(renderMiniCartItem).join('')}</div>
      <div class="mini-cart-footer">
        <div class="mini-cart-footer-total">
          ${totalDiscount ? `
            <div class="mini-cart-footer-top">
              <span class="mini-cart-price-old">${formatPriceNumber(totalOld)}</span>
              <span class="mini-cart-discount-badge">${totalDiscount}%</span>
            </div>` : ''}
          <div class="mini-cart-price-now">
            <span class="mini-cart-price-amount">${formatPriceNumber(total)}</span>
            <span class="mini-cart-price-unit">تومان</span>
          </div>
        </div>
        <a href="checkout.html" class="mini-cart-checkout-btn">ثبت سفارش</a>
      </div>`;
  };

  const getMiniCartPanel = () => document.getElementById('header-mini-cart');
  const getMiniCartToggle = () => document.getElementById('header-cart-toggle');
  const isMiniCartOpen = () => getMiniCartPanel()?.classList.contains('is-open');

  let miniCartCloseTimer = null;

  const cancelMiniCartClose = () => {
    if (miniCartCloseTimer) {
      clearTimeout(miniCartCloseTimer);
      miniCartCloseTimer = null;
    }
  };

  const scheduleMiniCartClose = (delayMs = 140) => {
    cancelMiniCartClose();
    miniCartCloseTimer = setTimeout(() => {
      miniCartCloseTimer = null;
      closeMiniCart();
    }, delayMs);
  };

  const isScrollInsideMiniCart = (target) => {
    if (!target || !(target instanceof Node)) return false;
    const panel = getMiniCartPanel();
    const wrap = document.querySelector('.header-cart-wrap');
    if (panel && (target === panel || panel.contains(target))) return true;
    if (wrap && (target === wrap || wrap.contains(target))) return true;
    return false;
  };

  const closeMiniCart = () => {
    const panel = getMiniCartPanel();
    const toggle = getMiniCartToggle();
    if (!panel || !toggle || !isMiniCartOpen()) return;
    cancelMiniCartClose();
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('is-open');
  };

  const openMiniCart = () => {
    const panel = getMiniCartPanel();
    const toggle = getMiniCartToggle();
    if (!panel || !toggle) return;
    cancelMiniCartClose();
    renderMiniCart();
    panel.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.add('is-open');
    requestAnimationFrame(() => {
      panel.classList.add('is-open');
    });
  };

  const initMiniCart = () => {
    const wrap = document.querySelector('.header-cart-wrap');
    const toggle = getMiniCartToggle();
    if (!wrap || !toggle || wrap.dataset.miniCartBound === '1') return;
    wrap.dataset.miniCartBound = '1';

    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      if (isMiniCartOpen()) return;
      openMiniCart();
    });

    wrap.addEventListener('mouseenter', cancelMiniCartClose);
    wrap.addEventListener('mouseleave', (event) => {
      const related = event.relatedTarget;
      if (related && wrap.contains(related)) return;
      scheduleMiniCartClose(120);
    });

    wrap.addEventListener('click', (event) => {
      event.stopPropagation();
      const removeBtn = event.target.closest('[data-mini-remove]');
      if (removeBtn) {
        Store.card?.removeFromCard?.(removeBtn.dataset.miniRemove);
        Store.card?.updateCardUI?.();
        renderMiniCart();
        cancelMiniCartClose();
        return;
      }
      const addBtn = event.target.closest('[data-mini-add]');
      if (addBtn) {
        const id = addBtn.dataset.miniAdd;
        const row = Store.card?.getCardEntity?.().cardItems.find((i) => i.productId === id);
        if (row) Store.card?.setQty?.(id, row.quantity + 1);
        Store.card?.updateCardUI?.();
        renderMiniCart();
        cancelMiniCartClose();
      }
    });

    if (!document.documentElement.dataset.miniCartDocBound) {
      document.documentElement.dataset.miniCartDocBound = '1';
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMiniCart();
      });
      window.addEventListener('scroll', (event) => {
        if (!isMiniCartOpen()) return;
        if (isScrollInsideMiniCart(event.target)) return;
        closeMiniCart();
      }, { passive: true, capture: true });
    }
  };

  const refreshMiniCart = () => {
    if (isMiniCartOpen()) renderMiniCart();
  };

  // ─── Mount ─────────────────────────────────────────────────────────

  function mountHeader() {
    const host = document.getElementById('store-header');
    if (host) host.innerHTML = renderHeaderShell();
  }

  function mountFooter() {
    const host = document.getElementById('store-footer');
    if (host) host.innerHTML = renderFooterShell();
  }

  function mountLayout() {
    mountHeader();
    mountFooter();
    applyBranding();
    initMegaMenuHover();
    initSearchForms();
    initMiniCart();
    syncCardBadge();
  }

  mountLayout();

  Store.layout = {
    mount: mountLayout,
    applyBranding,
    initMegaMenuHover,
    refreshMegaSubPanels,
    initSearchForms,
    initMiniCart,
    refreshMiniCart,
    renderMiniCart
  };
})(window.SimpleStore = window.SimpleStore || {});
