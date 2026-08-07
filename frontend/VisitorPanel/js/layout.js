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
  const SHOP = {
    name: 'TahlilDadeh Simple Shop',
    tagline: 'فروشگاه اینترنتی',
    footerTagline: 'خرید مطمئن، ارسال سریع',
    description:
      'فروشگاه اینترنتی TahlilDadeh Simple Shop با تمرکز روی تجربه کاربری حرفه‌ای، قیمت شفاف و پشتیبانی واقعی.',
    previewBanner: 'فروشگاه آزمایشی TahlilDadeh Simple Shop',
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

  function renderBrandBlock(tagline) {
    return `
      <a href="index.html" class="brand" data-store-brand>
        <span class="brand-mark" data-brand-mark><i class="bi bi-bag-heart-fill"></i></span>
        <span class="brand-text">
          <strong data-brand-name>${SHOP.name}</strong>
          <small data-brand-tagline>${tagline}</small>
        </span>
      </a>`;
  }

  function renderSearchForm() {
    return `
      <form class="search-box" role="search" data-store-search>
        <input type="search" name="q" placeholder="جستجو در محصولات، برندها و دسته‌ها..." aria-label="جستجو">
        <button type="submit" class="btn-search" aria-label="جستجو"><i class="bi bi-search"></i></button>
      </form>`;
  }

  function renderHeaderActions() {
    return `
      <div class="header-actions">
        <a href="auth.html?tab=register&amp;role=Supplier"><i class="bi bi-shop-window"></i> فروشنده شوید</a>
        <a href="auth.html"><i class="bi bi-box-arrow-in-left"></i> ورود / ثبت‌نام</a>
        <a href="card.html" class="action-btn cart-btn" title="کارت خرید">
          <i class="bi bi-credit-card-2-front"></i>
          <span class="cart-badge" data-card-count data-cart-count>0</span>
          <span class="cart-meta d-none d-lg-inline">
            <small>کارت خرید</small>
            <strong data-card-total data-cart-total>۰ ت</strong>
          </span>
        </a>
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
                <i class="bi bi-grid"></i> دسته‌بندی کالاها <i class="bi bi-chevron-down"></i>
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
            <li><a href="category.html?tag=amazing" class="nav-amazing"><i class="bi bi-lightning-charge-fill"></i> شگفت‌انگیزها</a></li>
            <li><a href="category.html">پرفروش‌ترین‌ها</a></li>
            <li><a href="category.html?tag=sale" class="nav-sale">تخفیف‌ها</a></li>
            <li><a href="auth.html">حساب کاربری</a></li>
            <li class="ms-auto d-none d-xl-block">
              <a href="category.html?tag=special" class="mega-highlight"><i class="bi bi-gift"></i> پیشنهاد ویژه</a>
            </li>
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
        <div class="brand" data-store-brand>
          <span class="brand-mark" data-brand-mark><i class="bi bi-bag-heart-fill"></i></span>
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
              { href: 'auth.html?tab=login', label: 'پیگیری سفارش' },
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
        mark.classList.add('has-logo');
        mark.innerHTML = `<img src="${logo}" alt="${name || 'لوگو'}" class="brand-logo-img">`;
      } else {
        mark.classList.remove('has-logo');
        mark.innerHTML = '<i class="bi bi-bag-heart-fill"></i>';
      }
    });
  }

  // ─── Interactions (bound once after mount) ───────────────────────

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
    syncCardBadge();
  }

  mountLayout();

  Store.layout = {
    mount: mountLayout,
    applyBranding,
    initMegaMenuHover,
    initSearchForms
  };
})(window.SimpleStore = window.SimpleStore || {});
