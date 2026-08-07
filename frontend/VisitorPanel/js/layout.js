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

  function renderMegaCategoryList(tree) {
    const roots = tree?.length ? tree : DEMO_CATEGORIES;
    return roots.map((c, i) => `
      <a class="mega-cat${i === 0 ? ' active' : ''}" href="${categoryLink(c.id)}" data-panel="${escapeHtml(String(c.id))}">
        <i class="bi ${escapeHtml(c.icon || 'bi-grid')}"></i>
        <span>${escapeHtml(c.name)}</span>
      </a>`).join('');
  }

  function renderMegaSubPanelFromNode(node, isFirst) {
    const id = escapeHtml(String(node.id));
    const name = escapeHtml(node.name || 'دسته');
    const children = node.children || [];
    const hidden = isFirst ? '' : ' d-none';

    const columns = children.map((child) => {
      const l1Href = categoryLink(child.id);
      const l1Name = escapeHtml(child.name);
      const l2Items = (child.children || []).map((gc) =>
        `<a href="${categoryLink(gc.id)}" class="mega-sub-l2">${escapeHtml(gc.name)}</a>`
      ).join('');
      return `
        <div class="mega-sub-column">
          <a href="${l1Href}" class="mega-sub-heading">
            <span class="mega-sub-heading-bar" aria-hidden="true"></span>
            ${l1Name}
          </a>
          ${l2Items ? `<div class="mega-sub-links">${l2Items}</div>` : ''}
        </div>`;
    }).join('');

    const body = columns
      ? `<div class="mega-sub-columns">${columns}</div>`
      : '<p class="mega-empty-sub mb-0">زیردسته‌ای وجود ندارد.</p>';

    return `
      <div class="mega-col links${hidden}" id="mega-panel-${id}" data-mega-panel="${id}">
        <a href="${categoryLink(node.id)}" class="mega-all-link">
          <span>همه کالاهای ${name}</span>
          <i class="bi bi-chevron-left" aria-hidden="true"></i>
        </a>
        ${body}
      </div>`;
  }

  function renderMobileCategoryDrawer() {
    return `
      <div class="mobile-cat-drawer" id="mobile-cat-drawer" aria-hidden="true">
        <div class="mobile-cat-backdrop" data-mobile-cat-close tabindex="-1"></div>
        <aside class="mobile-cat-panel" role="dialog" aria-modal="true" aria-labelledby="mobile-cat-title">
          <div class="mobile-cat-header">
            <button type="button" class="mobile-cat-back d-none" data-mobile-cat-back aria-label="بازگشت">
              <i class="bi bi-arrow-right" aria-hidden="true"></i>
            </button>
            <strong id="mobile-cat-title" data-mobile-cat-title>دسته‌بندی‌ها</strong>
            <button type="button" class="mobile-cat-close" data-mobile-cat-close aria-label="بستن">
              <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          </div>
          <nav class="mobile-cat-body" data-mobile-cat-body aria-label="منوی دسته‌بندی"></nav>
        </aside>
      </div>`;
  }

  function renderMegaNav() {
    const demoTree = DEMO_CATEGORIES.map((c) => ({ ...c, children: [] }));
    const subPanels = demoTree.map((node, i) => renderMegaSubPanelFromNode(node, i === 0)).join('');

    return `
      <nav class="mega-nav">
        <div class="container-xxl">
          <ul class="mega-nav-list">
            <li class="mega-item">
              <button type="button" class="mega-trigger" data-mega-toggle data-mobile-cat-open aria-expanded="false" aria-controls="mega-panel-desktop">
                <i class="bi bi-list" aria-hidden="true"></i>
                <span>دسته‌بندی کالاها</span>
              </button>
              <div class="mega-panel" id="mega-panel-desktop" aria-hidden="true">
                <div class="mega-cols">
                  <div class="mega-col categories">${renderMegaCategoryList(demoTree)}</div>
                  <div class="mega-col-content">
                    ${subPanels}
                  </div>
                </div>
              </div>
            </li>
            <li class="mega-nav-divider d-none d-lg-block" aria-hidden="true"></li>
            <li><a href="category.html?tag=amazing" class="mega-nav-link"><i class="bi bi-percent" aria-hidden="true"></i><span>شگفت‌انگیزها</span></a></li>
            <li><a href="category.html" class="mega-nav-link"><i class="bi bi-basket2" aria-hidden="true"></i><span>پرفروش‌ترین‌ها</span></a></li>
            <li><a href="category.html?tag=sale" class="mega-nav-link"><i class="bi bi-tags" aria-hidden="true"></i><span>تخفیف‌ها</span></a></li>
          </ul>
        </div>
      </nav>
      ${renderMobileCategoryDrawer()}`;
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

  let mobileCategoryTree = [];
  let mobileNavStack = [];

  function refreshMegaMenu(tree) {
    const roots = Array.isArray(tree) && tree.length ? tree : DEMO_CATEGORIES.map((c) => ({ ...c, children: [] }));
    mobileCategoryTree = roots;

    const container = document.querySelector('.mega-cols');
    if (!container) {
      initMobileCategoryMenu(roots);
      return;
    }

    const catCol = container.querySelector('.mega-col.categories');
    if (catCol) {
      const rootsSlice = roots.slice(0, 20);
      catCol.innerHTML = rootsSlice.map((c, i) => `
        <a class="mega-cat${i === 0 ? ' active' : ''}" href="${categoryLink(c.id)}" data-panel="${escapeHtml(String(c.id))}">
          <i class="bi ${escapeHtml(c.icon || 'bi-grid')}"></i>
          <span>${escapeHtml(c.name)}</span>
        </a>`).join('');
      catCol.classList.toggle('mega-col--scrollable', rootsSlice.length > 6);
      delete catCol.dataset.megaBound;
    }

    container.querySelectorAll('.mega-col-content .mega-col.links').forEach((el) => el.remove());
    const contentCol = container.querySelector('.mega-col-content');
    if (contentCol) {
      contentCol.innerHTML = roots.slice(0, 20).map((node, i) => renderMegaSubPanelFromNode(node, i === 0)).join('');
    }

    initMegaMenuHover();
    initMegaMenuToggle();
    initMobileCategoryMenu(roots);
  }

  function refreshMegaSubPanels(categories) {
    const tree = (categories || []).map((c) => ({ ...c, children: [] }));
    refreshMegaMenu(tree);
  }

  function renderMobileCategoryLevel(nodes, parentNode) {
    const items = [];

    if (parentNode) {
      items.push(`
        <a href="${categoryLink(parentNode.id)}" class="mobile-cat-item mobile-cat-item--all">
          <span>همه ${escapeHtml(parentNode.name)}</span>
          <i class="bi bi-box-arrow-up-left" aria-hidden="true"></i>
        </a>`);
    }

    nodes.forEach((node) => {
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      if (hasChildren) {
        items.push(`
          <button type="button" class="mobile-cat-item" data-mobile-drill="${escapeHtml(String(node.id))}">
            <span>${escapeHtml(node.name)}</span>
            <i class="bi bi-chevron-left" aria-hidden="true"></i>
          </button>`);
      } else {
        items.push(`
          <a href="${categoryLink(node.id)}" class="mobile-cat-item">
            <span>${escapeHtml(node.name)}</span>
            <i class="bi bi-chevron-left" aria-hidden="true"></i>
          </a>`);
      }
    });

    return items.join('');
  }

  function findNodeInTree(tree, id) {
    const sid = String(id);
    for (const node of tree) {
      if (String(node.id) === sid) return node;
      for (const child of node.children || []) {
        if (String(child.id) === sid) return child;
        for (const gc of child.children || []) {
          if (String(gc.id) === sid) return gc;
        }
      }
    }
    return null;
  }

  function updateMobileCategoryView() {
    const drawer = document.getElementById('mobile-cat-drawer');
    const body = drawer?.querySelector('[data-mobile-cat-body]');
    const titleEl = drawer?.querySelector('[data-mobile-cat-title]');
    const backBtn = drawer?.querySelector('[data-mobile-cat-back]');
    if (!body || !titleEl || !backBtn) return;

    const frame = mobileNavStack[mobileNavStack.length - 1];
    if (!frame) return;

    titleEl.textContent = frame.title;
    backBtn.classList.toggle('d-none', mobileNavStack.length <= 1);
    body.innerHTML = renderMobileCategoryLevel(frame.nodes, frame.parentNode || null);
  }

  function openMobileCategoryDrawer() {
    const drawer = document.getElementById('mobile-cat-drawer');
    if (!drawer) return;

    mobileNavStack = [{
      nodes: mobileCategoryTree,
      title: 'دسته‌بندی‌ها',
      parentNode: null
    }];
    updateMobileCategoryView();

    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('mobile-cat-open');
    document.querySelector('.mega-item')?.classList.add('is-open');
  }

  function closeMobileCategoryDrawer() {
    const drawer = document.getElementById('mobile-cat-drawer');
    if (!drawer || !drawer.classList.contains('is-open')) return;

    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('mobile-cat-open');
    document.querySelector('.mega-item')?.classList.remove('is-open');
    mobileNavStack = [];
  }

  function initMobileCategoryMenu(tree) {
    if (Array.isArray(tree) && tree.length) {
      mobileCategoryTree = tree;
    }
    const drawer = document.getElementById('mobile-cat-drawer');
    if (!drawer) return;
    if (drawer.dataset.mobileCatBound === '1') return;
    drawer.dataset.mobileCatBound = '1';

    drawer.addEventListener('click', (event) => {
      if (event.target.closest('[data-mobile-cat-close]')) {
        closeMobileCategoryDrawer();
        return;
      }

      const backBtn = event.target.closest('[data-mobile-cat-back]');
      if (backBtn) {
        if (mobileNavStack.length > 1) {
          mobileNavStack.pop();
          updateMobileCategoryView();
        }
        return;
      }

      const drillBtn = event.target.closest('[data-mobile-drill]');
      if (drillBtn) {
        const node = findNodeInTree(mobileCategoryTree, drillBtn.dataset.mobileDrill);
        if (!node?.children?.length) return;
        mobileNavStack.push({
          nodes: node.children,
          title: node.name,
          parentNode: node
        });
        updateMobileCategoryView();
      }
    });

    if (!document.documentElement.dataset.mobileCatDocBound) {
      document.documentElement.dataset.mobileCatDocBound = '1';
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMobileCategoryDrawer();
      });
    }
  }

  function openMegaMenu() {
    const megaItem = document.querySelector('.mega-item');
    const panel = document.getElementById('mega-panel-desktop');
    const trigger = document.querySelector('[data-mega-toggle]');
    if (!megaItem || !panel) return;
    megaItem.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    trigger?.setAttribute('aria-expanded', 'true');
  }

  function closeMegaMenu() {
    const megaItem = document.querySelector('.mega-item');
    const panel = document.getElementById('mega-panel-desktop');
    const trigger = document.querySelector('[data-mega-toggle]');
    if (!megaItem || !panel) return;
    megaItem.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    trigger?.setAttribute('aria-expanded', 'false');
  }

  function initMegaMenuToggle() {
    const megaItem = document.querySelector('.mega-item');
    const trigger = document.querySelector('[data-mega-toggle]');
    if (!megaItem || !trigger || megaItem.dataset.megaToggleBound === '1') return;
    megaItem.dataset.megaToggleBound = '1';

    trigger.addEventListener('click', (event) => {
      if (window.matchMedia('(max-width: 991.98px)').matches) {
        event.preventDefault();
        openMobileCategoryDrawer();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (megaItem.classList.contains('is-open')) {
        closeMegaMenu();
      } else {
        openMegaMenu();
      }
    });

    megaItem.addEventListener('mouseleave', (event) => {
      if (!window.matchMedia('(min-width: 992px)').matches) return;
      const related = event.relatedTarget;
      if (related && megaItem.contains(related)) return;
      closeMegaMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMegaMenu();
    });
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
    initMegaMenuToggle();
    initSearchForms();
    initMiniCart();
    syncCardBadge();
    const tree = Store.catalog?.CATEGORY_TREE?.length
      ? Store.catalog.CATEGORY_TREE
      : DEMO_CATEGORIES.map((c) => ({ ...c, children: [] }));
    initMobileCategoryMenu(tree);
  }

  mountLayout();

  Store.layout = {
    mount: mountLayout,
    applyBranding,
    initMegaMenuHover,
    initMegaMenuToggle,
    openMegaMenu,
    closeMegaMenu,
    refreshMegaMenu,
    refreshMegaSubPanels,
    initMobileCategoryMenu,
    initSearchForms,
    initMiniCart,
    refreshMiniCart,
    renderMiniCart
  };
})(window.SimpleStore = window.SimpleStore || {});
