/**
 * SimpleShop visitor store — catalog, card, shared UI helpers
 */
(function (Store) {
  'use strict';

  const CARD_KEY = 'simpleShopVisitorCard';
  const LEGACY_CART_KEY = 'simpleShopVisitorCart';
  const CARD_VERSION = 1;
  const CARD_EXPIRY_DAYS = 30;
  const ICONS = ['bi-box-seam', 'bi-phone', 'bi-laptop', 'bi-headphones', 'bi-watch', 'bi-house-heart', 'bi-controller'];

  const CAT_STRIP_TONES = ['purple', 'charcoal', 'pink', 'tan', 'gold', 'teal', 'orange', 'black'];

  let CATEGORIES = [];
  let CATEGORY_TREE = [];
  let source = 'offline';

  let PRODUCTS = [];

  const TAG_LABELS = {
    amazing: 'پیشنهاد شگفت‌انگیز',
    special: 'پیشنهاد ویژه',
    sale: 'فروش ویژه'
  };

  const escapeHtml = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  /** نمایش تاریخ شمسی در UI — مقدار API/ذخیره همیشه ISO/میلادی می‌ماند */
  const PERSIAN_LOCALE = 'fa-IR-u-ca-persian';

  const formatDate = (dateInput) => {
    if (!dateInput) return '—';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(PERSIAN_LOCALE, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateTime = (dateInput) => {
    if (!dateInput) return '—';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(PERSIAN_LOCALE, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (n, short = false) => {
    const formatted = Number(n || 0).toLocaleString('fa-IR');
    return short ? `${formatted} ت` : `${formatted} تومان`;
  };

  const formatPriceNumber = (n) => Number(n || 0).toLocaleString('fa-IR');

  const getProduct = (id) =>
    PRODUCTS.find((p) => String(p.id) === String(id)) || null;

  const getByCategory = (catId) =>
    PRODUCTS.filter((p) => String(p.category) === String(catId));

  const mapApiProduct = (dto, index = 0) => {
    const price = Number(dto.price) || 0;
    const stock = Number(dto.stock) || 0;
    let tag = '';
    let amazing = false;
    if (stock > 0 && stock <= 5) {
      tag = 'amazing';
      amazing = true;
    } else if (price >= 10000000) {
      tag = 'special';
    } else if (stock === 0) {
      tag = 'sale';
    }

    return {
      id: String(dto.id),
      title: dto.name || 'محصول',
      price,
      icon: ICONS[index % ICONS.length],
      imageUrl: dto.imageUrl || dto.ImageUrl || '',
      thumbnailUrl: dto.thumbnailUrl || dto.ThumbnailUrl || dto.imageUrl || dto.ImageUrl || '',
      gallery: Array.isArray(dto.gallery) ? dto.gallery : (Array.isArray(dto.Gallery) ? dto.Gallery : []),
      rating: 4.5,
      reviews: Math.max(12, (dto.id * 17) % 900),
      category: String(dto.categoryId ?? ''),
      brand: dto.supplierName || dto.categoryName || ((window.SimpleShopSite && window.SimpleShopSite.name) || 'فروشگاه ساده تحلیل داده'),
      stock,
      amazing,
      tag,
      description: dto.description || 'توضیحات این محصول به‌زودی تکمیل می‌شود.',
      categoryName: dto.categoryName || '',
      supplierName: dto.supplierName || '',
      metaTitle: dto.metaTitle || dto.MetaTitle || '',
      metaDescription: dto.metaDescription || dto.MetaDescription || ''
    };
  };

  const normalizeTreeNode = (dto, iconIndex = 0) => {
    const isActive = dto.isActive ?? dto.IsActive !== false;
    if (!isActive) return null;

    const rawChildren = dto.children ?? dto.Children ?? [];
    const children = rawChildren
      .map((child, i) => normalizeTreeNode(child, iconIndex + i + 1))
      .filter(Boolean)
      .map((child) => ({
        ...child,
        children: (child.children || []).map((grandchild) => ({
          ...grandchild,
          children: []
        }))
      }));

    return {
      id: String(dto.id ?? dto.Id),
      name: dto.name ?? dto.Name ?? '',
      slug: dto.slug ?? dto.Slug ?? '',
      icon: ICONS[iconIndex % ICONS.length],
      children
    };
  };

  const buildTreeFromFlat = (flat) =>
    flat.slice(0, 8).map((c, i) => ({
      id: String(c.id),
      name: c.name,
      icon: c.icon || ICONS[i % ICONS.length],
      children: []
    }));


  const loadFromOffline = async () => {
    const loader = globalThis.SimpleShopOfflineData;
    if (!loader) return false;
    try {
      const [catData, prodData] = await Promise.all([
        loader.loadCategories(),
        loader.loadProducts()
      ]);
      const prodItems = (prodData.items || []).filter((p) => p.isActive !== false);
      if (!prodItems.length) return false;

      PRODUCTS = prodItems.map((dto, i) => mapApiProduct(dto, i));

      const tree = catData.tree || [];
      if (tree.length) {
        CATEGORY_TREE = tree
          .map((node, i) => normalizeTreeNode(node, i))
          .filter(Boolean);
        CATEGORIES = CATEGORY_TREE.slice(0, 8).map(({ id, name, icon }, i) => ({
          id,
          name,
          icon: icon || ICONS[i % ICONS.length]
        }));
      } else {
        const flat = (catData.items || []).filter((c) => c.isActive !== false);
        CATEGORY_TREE = buildTreeFromFlat(flat);
        CATEGORIES = CATEGORY_TREE.slice(0, 8).map(({ id, name, icon }, i) => ({
          id,
          name,
          icon: icon || ICONS[i % ICONS.length]
        }));
      }

      source = 'offline';
      refreshCategoryNav();
      document.dispatchEvent(new CustomEvent('catalog:ready', { detail: { source } }));
      return true;
    } catch (err) {
      console.warn('[VisitorPanel] Offline JSON unavailable.', err);
      return false;
    }
  };

  const fetchAllProductsFromApi = async () => {
    const pageSize = 50;
    let page = 1;
    let all = [];
    let total = Infinity;

    while (all.length < total && page <= 20) {
      const paged = await Store.api.getProducts({ page, pageSize, sortBy: 'name', sortDir: 'asc' });
      const items = paged?.items || paged?.Items || [];
      const search = paged?.searchModel || paged?.SearchModel || {};
      total = Number(search.recordCount ?? search.RecordCount ?? items.length) || items.length;
      all = all.concat(items);
      if (!items.length || items.length < pageSize) break;
      page += 1;
    }

    return all;
  };

  const applyCategoryTree = (tree) => {
    if (!Array.isArray(tree) || !tree.length) return;
    CATEGORY_TREE = tree
      .map((node, i) => normalizeTreeNode(node, i))
      .filter(Boolean);
    CATEGORIES = CATEGORY_TREE.slice(0, 8).map(({ id, name, icon }, i) => ({
      id,
      name,
      icon: icon || ICONS[i % ICONS.length]
    }));
    refreshCategoryNav();
  };

  const loadFromApi = async () => {
    if (!Store.config?.USE_API || !Store.api) return false;

    let productDtos = [];
    try {
      productDtos = await fetchAllProductsFromApi();
    } catch (err) {
      console.warn('[VisitorPanel] Product API failed.', err);
      return false;
    }
    if (!productDtos.length) return false;

    PRODUCTS = productDtos.map((dto, i) => mapApiProduct(dto, i));
    source = 'api';
    refreshCategoryNav();
    document.dispatchEvent(new CustomEvent('catalog:ready', { detail: { source } }));

    Store.api.getCategoriesTree()
      .then((tree) => applyCategoryTree(tree))
      .catch((err) => console.warn('[VisitorPanel] Category tree API failed.', err));

    return true;
  };

  const categoryHref = (catId) => `category.html?id=${encodeURIComponent(String(catId))}`;

  const renderCatChip = (c, index) => {
    const tone = CAT_STRIP_TONES[index % CAT_STRIP_TONES.length];
    return `
        <a href="${categoryHref(c.id)}" class="cat-chip" data-tone="${tone}">
          <span class="cat-chip__icon"><i class="bi ${escapeHtml(c.icon || 'bi-grid')}"></i></span>
          <span class="cat-chip__label">${escapeHtml(c.name)}</span>
        </a>`;
  };

  const refreshCategoryNav = () => {
    const tree = CATEGORY_TREE.length ? CATEGORY_TREE : buildTreeFromFlat(CATEGORIES);
    Store.layout?.refreshMegaMenu?.(tree);

    document.querySelectorAll('[data-category-link]').forEach((el) => {
      const catId = el.dataset.categoryLink;
      if (catId) el.setAttribute('href', categoryHref(catId));
    });

    document.querySelectorAll('.mega-nav-list a[href*="cat="]').forEach((el) => {
      el.setAttribute('href', 'category.html');
    });

    const catStrip = document.querySelector('[data-cat-strip], .cat-strip');
    if (catStrip && CATEGORIES.length) {
      catStrip.innerHTML = CATEGORIES.slice(0, 8).map(renderCatChip).join('');
    }
  };

  const ready = (async () => {
    try {
      if (Store.config?.USE_API) {
        const ok = await loadFromApi();
        if (ok) return { source };
      }
    } catch (err) {
      console.warn('[VisitorPanel] API unavailable, trying offline JSON.', err);
    }
    try {
      const ok = await loadFromOffline();
      if (ok) return { source };
    } catch (err) {
      console.warn('[VisitorPanel] Offline JSON unavailable.', err);
    }
    PRODUCTS = [];
    CATEGORIES = [];
    CATEGORY_TREE = [];
    source = 'empty';
    refreshCategoryNav();
    document.dispatchEvent(new CustomEvent('catalog:ready', { detail: { source } }));
    return { source };
  })();

  const searchProducts = (q) => {
    const term = String(q || '').trim().toLowerCase();
    if (!term) return PRODUCTS.slice();
    return PRODUCTS.filter((p) =>
      [p.title, p.brand, p.category, TAG_LABELS[p.tag] || ''].join(' ').toLowerCase().includes(term)
    );
  };

  const getAmazing = () => PRODUCTS.filter((p) => p.amazing || p.tag === 'amazing');

  const productFamily = (title) => {
    const t = String(title || '');
    if (/گوشی|موبایل/.test(t)) return 'phone';
    if (/تبلت|کتابخوان/.test(t)) return 'tablet';
    if (/لپ|نوت‌بوک|نوت بوک/.test(t)) return 'laptop';
    if (/تلویزیون|اسپیکر|ساندبار/.test(t)) return 'audio';
    if (/کنسول|گیم|دسته/.test(t)) return 'gaming';
    if (/جارو|مخلوط|قهوه|توستر/.test(t)) return 'home';
    if (/کتاب|دفتر|خودکار|مدرسه‌ای/.test(t)) return 'books';
    if (/کت|کفش|تی‌شرت|شلوار/.test(t)) return 'fashion';
    if (/کرم|شامپو|عطر|رژ/.test(t)) return 'beauty';
    if (/هدفون|کیبورد|ماوس|شارژر|پاور|کابل/.test(t)) return 'accessory';
    return 'other';
  };

  const getRelated = (product, limit = 4) => {
    if (!product) return [];
    const cat = String(product.category ?? '');
    const sameCategory = PRODUCTS.filter(
      (p) => String(p.id) !== String(product.id) && String(p.category) === cat
    );
    const family = productFamily(product.title);
    const sameFamily = sameCategory.filter((p) => productFamily(p.title) === family);
    const pool = sameFamily.length >= 1 ? sameFamily : sameCategory;
    return pool.slice(0, limit);
  };

  /* ─── Virtual card (browser-only, no login required) ─── */
  const cardExpiryMs = () => CARD_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  const resolveProductImage = (p) => {
    const raw = p?.thumbnailUrl || p?.imageUrl || '';
    if (!raw) return '';
    return Store.api?.mediaUrl ? Store.api.mediaUrl(raw) : raw;
  };

  const snapshotFromProduct = (p, quantity) => ({
    productId: String(p.id),
    quantity,
    unitPrice: p.price,
    lineTotal: p.price * quantity,
    title: p.title,
    imageUrl: resolveProductImage(p),
    brand: p.brand || '',
    categoryName: p.categoryName || '',
    categoryId: p.category || '',
    stock: p.stock ?? 0,
    icon: p.icon || 'bi-box-seam'
  });

  const computeItemsTotal = (cardItems) =>
    cardItems.reduce((sum, row) => sum + (Number(row.lineTotal) || 0), 0);

  const emptyCardEntity = () => {
    const now = new Date();
    return {
      version: CARD_VERSION,
      collectedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + cardExpiryMs()).toISOString(),
      itemsTotal: 0,
      cardItems: []
    };
  };

  const normalizeCardEntity = (raw) => {
    if (!raw) return emptyCardEntity();
    const now = new Date();

    if (Array.isArray(raw)) {
      const cardItems = raw.map((row) => {
        const p = getProduct(row.id ?? row.productId);
        const qty = Number(row.qty ?? row.quantity) || 1;
        return p ? snapshotFromProduct(p, qty) : null;
      }).filter(Boolean);
      return {
        version: CARD_VERSION,
        collectedAt: now.toISOString(),
        updatedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + cardExpiryMs()).toISOString(),
        itemsTotal: computeItemsTotal(cardItems),
        cardItems
      };
    }

    if (raw && Array.isArray(raw.items) && !raw.cardItems) {
      raw = {
        ...raw,
        cardItems: raw.items.map((row) => ({
          productId: String(row.productId ?? row.id),
          quantity: Number(row.quantity ?? row.qty) || 1,
          unitPrice: row.unitPrice ?? 0,
          lineTotal: row.lineTotal ?? 0,
          title: row.title || '',
          imageUrl: row.imageUrl || ''
        }))
      };
    }

    if (raw && Array.isArray(raw.cardItems)) {
      return {
        version: raw.version || CARD_VERSION,
        collectedAt: raw.collectedAt || raw.updatedAt || now.toISOString(),
        updatedAt: raw.updatedAt || now.toISOString(),
        expiresAt: raw.expiresAt || new Date(now.getTime() + cardExpiryMs()).toISOString(),
        itemsTotal: Number.isFinite(raw.itemsTotal) ? raw.itemsTotal : computeItemsTotal(raw.cardItems),
        cardItems: raw.cardItems.map((row) => ({
          productId: String(row.productId),
          quantity: Number(row.quantity) || 1,
          unitPrice: Number(row.unitPrice) || 0,
          lineTotal: Number(row.lineTotal) || (Number(row.unitPrice) || 0) * (Number(row.quantity) || 1),
          title: row.title || '',
          imageUrl: row.imageUrl || '',
          brand: row.brand || '',
          categoryName: row.categoryName || '',
          categoryId: row.categoryId || '',
          stock: row.stock ?? 0,
          icon: row.icon || 'bi-box-seam'
        }))
      };
    }

    return emptyCardEntity();
  };

  const isCardExpired = (entity) => {
    if (!entity?.expiresAt) return false;
    return new Date(entity.expiresAt) < new Date();
  };

  const notifyIfStoredCardExpired = () => {
    try {
      const raw = localStorage.getItem(CARD_KEY) || localStorage.getItem(LEGACY_CART_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const expiresAt = parsed?.expiresAt;
      if (expiresAt && new Date(expiresAt) < new Date()) {
        localStorage.removeItem(CARD_KEY);
        localStorage.removeItem(LEGACY_CART_KEY);
        showToast('کارت خرید شما منقضی شده بود و پاک شد.');
      }
    } catch {
      /* ignore */
    }
  };

  /** Full virtual card entity */
  const getCardEntity = () => {
    try {
      let raw = localStorage.getItem(CARD_KEY);
      if (!raw) raw = localStorage.getItem(LEGACY_CART_KEY);
      const entity = normalizeCardEntity(raw ? JSON.parse(raw) : null);
      if (isCardExpired(entity)) {
        localStorage.removeItem(CARD_KEY);
        localStorage.removeItem(LEGACY_CART_KEY);
        return emptyCardEntity();
      }
      return entity;
    } catch {
      return emptyCardEntity();
    }
  };

  /** Legacy-compatible line list: [{ id, qty }] */
  const getCardLines = () =>
    getCardEntity().cardItems.map((row) => ({
      id: row.productId,
      qty: row.quantity
    }));

  const saveCardEntity = (entity) => {
    const payload = {
      ...entity,
      version: CARD_VERSION,
      updatedAt: new Date().toISOString(),
      itemsTotal: computeItemsTotal(entity.cardItems || [])
    };
    localStorage.setItem(CARD_KEY, JSON.stringify(payload));
    localStorage.removeItem(LEGACY_CART_KEY);
    updateCardUI();
    document.dispatchEvent(new CustomEvent('card:updated', { detail: payload }));
  };

  const cardCount = () => getCardEntity().cardItems.reduce((s, i) => s + i.quantity, 0);

  const cardTotal = () => getCardEntity().itemsTotal || computeItemsTotal(getCardEntity().cardItems);

  const getExpiryInfo = () => {
    const entity = getCardEntity();
    const expires = new Date(entity.expiresAt);
    const daysLeft = Math.max(0, Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000)));
    return { expiresAt: entity.expiresAt, daysLeft, isExpired: isCardExpired(entity) };
  };

  const addToCard = (id, qty = 1) => {
    const product = getProduct(id);
    if (!product) return false;
    const entity = getCardEntity();
    const cardItems = [...entity.cardItems];
    const pid = String(id);
    const existing = cardItems.find((i) => i.productId === pid);
    if (existing) {
      existing.quantity += qty;
      Object.assign(existing, snapshotFromProduct(product, existing.quantity));
    } else {
      cardItems.push(snapshotFromProduct(product, qty));
    }
    saveCardEntity({ ...entity, cardItems });
    return true;
  };

  const setQty = (id, qty) => {
    const entity = getCardEntity();
    let cardItems = [...entity.cardItems];
    const pid = String(id);
    if (qty <= 0) {
      cardItems = cardItems.filter((i) => i.productId !== pid);
    } else {
      const row = cardItems.find((i) => i.productId === pid);
      const product = getProduct(pid);
      if (row && product) Object.assign(row, snapshotFromProduct(product, qty));
    }
    saveCardEntity({ ...entity, cardItems });
  };

  const removeFromCard = (id) => {
    const entity = getCardEntity();
    saveCardEntity({
      ...entity,
      cardItems: entity.cardItems.filter((i) => i.productId !== String(id))
    });
  };

  const clearCard = () => saveCardEntity(emptyCardEntity());

  const purgeInvalidCardItems = () => {
    const entity = getCardEntity();
    const cardItems = entity.cardItems.filter((row) => {
      const pid = String(row.productId);
      const product = getProduct(pid);
      if (!product) return false;
      if (source === 'api') {
        const n = parseInt(pid, 10);
        return Number.isFinite(n) && n > 0;
      }
      return true;
    });
    if (cardItems.length !== entity.cardItems.length) {
      saveCardEntity({ ...entity, cardItems });
      updateCardUI();
    }
    return cardItems;
  };

  /** Map virtual card → API order lines */
  const toOrderItems = () =>
    getCardEntity().cardItems
      .map((row) => ({
        productId: parseInt(row.productId, 10),
        quantity: row.quantity
      }))
      .filter((line) => Number.isFinite(line.productId) && line.productId > 0 && line.quantity > 0);

  const updateCardUI = () => {
    const count = cardCount();
    const total = cardTotal();
    document.querySelectorAll('[data-card-count], [data-cart-count]').forEach((el) => {
      el.textContent = count.toLocaleString('fa-IR');
      el.classList.toggle('is-empty', count === 0);
    });
    document.querySelectorAll('[data-card-total], [data-cart-total]').forEach((el) => {
      el.textContent = formatPrice(total, true);
    });
    Store.layout?.refreshMiniCart?.();
  };

  const tagHtml = (p) => {
    if (!p.tag) return '';
    const label = TAG_LABELS[p.tag] || '';
    const cls =
      p.tag === 'amazing' ? 'tag-amazing' :
      p.tag === 'sale' ? 'tag-sale' : 'tag-special';
    return `<span class="offer-tag ${cls}">${escapeHtml(label)}</span>`;
  };

  const productMediaSrc = (p) => {
    const raw = p.thumbnailUrl || p.imageUrl || '';
    if (!raw) return '';
    return Store.api?.mediaUrl ? Store.api.mediaUrl(raw) : raw;
  };

  const productCard = (p, { deal = false } = {}) => {
    const src = productMediaSrc(p);
    const media = src
      ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(p.title)}" loading="lazy">`
      : `<i class="bi ${escapeHtml(p.icon || 'bi-box-seam')} product-thumb-fallback" aria-hidden="true"></i>`;

    const priceTop = '<div class="product-price-top product-price-top--empty" aria-hidden="true"></div>';

    return `
    <article class="product-card" data-product-id="${escapeHtml(p.id)}">
      <a href="product.html?id=${encodeURIComponent(p.id)}" class="product-link">
        <div class="product-thumb">${media}</div>
        <h3 class="product-title">${escapeHtml(p.title)}</h3>
        <div class="product-price">
          ${priceTop}
          <div class="product-price-now">
            <span class="product-price-amount">${formatPriceNumber(p.price)}</span>
            <span class="product-price-unit">تومان</span>
          </div>
        </div>
      </a>
      <button type="button" class="add-btn ${deal || p.amazing ? 'add-btn-amazing' : ''}" data-add="${escapeHtml(p.id)}">
        ${deal || p.amazing ? 'خرید شگفت‌انگیز' : 'افزودن به کارت'}
      </button>
    </article>`;
  };

  const bindAddButtons = (root = document) => {
    root.querySelectorAll('[data-add]').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (addToCard(btn.dataset.add, 1)) {
          showToast('به کارت خرید اضافه شد');
        }
      });
      btn.dataset.bound = 'true';
    });
  };

  const showToast = (message) => {
    let el = document.getElementById('store-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'store-toast';
      el.className = 'store-toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2200);
  };

  const boot = () => {
    notifyIfStoredCardExpired();
    updateCardUI();
    bindAddButtons();
  };

  document.addEventListener('DOMContentLoaded', boot);

  Store.catalog = {
    get PRODUCTS() { return PRODUCTS; },
    get CATEGORIES() { return CATEGORIES; },
    get CATEGORY_TREE() { return CATEGORY_TREE; },
    get source() { return source; },
    TAG_LABELS,
    ready,
    loadFromApi,
    loadFromOffline,
    mapApiProduct,
    refreshCategoryNav,
    categoryHref,
    getProduct,
    getByCategory,
    searchProducts,
    getAmazing,
    getRelated
  };
  Store.card = {
    getCardEntity,
    getCardLines,
    getCartEntity: getCardEntity,
    getCart: getCardLines,
    addToCard,
    addToCart: addToCard,
    setQty,
    removeFromCard,
    removeFromCart: removeFromCard,
    clearCard,
    clearCart: clearCard,
    purgeInvalidCardItems,
    cardCount,
    cartCount: cardCount,
    cardTotal,
    cartTotal: cardTotal,
    getExpiryInfo,
    toOrderItems,
    updateCardUI,
    updateCartUI: updateCardUI,
    CARD_EXPIRY_DAYS
  };
  Store.cart = Store.card;
  Store.ui = {
    escapeHtml,
    formatPrice,
    formatPriceNumber,
    formatDate,
    formatDateTime,
    productCard,
    tagHtml,
    bindAddButtons,
    showToast
  };
})(window.SimpleStore = window.SimpleStore || {});
