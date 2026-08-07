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

  const DEMO_CATEGORIES = [
    { id: 'digital', name: 'کالای دیجیتال', icon: 'bi-phone' },
    { id: 'home', name: 'خانه و آشپزخانه', icon: 'bi-house-heart' },
    { id: 'fashion', name: 'مد و پوشاک', icon: 'bi-handbag' },
    { id: 'beauty', name: 'زیبایی و سلامت', icon: 'bi-balloon-heart' },
    { id: 'sport', name: 'ورزش و سفر', icon: 'bi-bicycle' },
    { id: 'gaming', name: 'گیمینگ', icon: 'bi-controller' }
  ];

  let CATEGORIES = DEMO_CATEGORIES.slice();
  let source = 'demo';

  const DEMO_PRODUCTS = [
    {
      id: 'p1',
      title: 'گوشی هوشمند Galaxy A55',
      price: 18500000,
      old: 21900000,
      discount: 15,
      icon: 'bi-phone',
      rating: 4.7,
      reviews: 1284,
      category: 'digital',
      brand: 'Samsung',
      stock: 24,
      amazing: true,
      tag: 'amazing',
      description: 'گوشی هوشمند با نمایشگر سوپر امولد، دوربین چندگانه و باتری بادوام. مناسب استفاده روزمره و عکاسی.'
    },
    {
      id: 'p2',
      title: 'هدفون بی‌سیم Noise Cancel',
      price: 4250000,
      old: 5100000,
      discount: 17,
      icon: 'bi-headphones',
      rating: 4.5,
      reviews: 642,
      category: 'digital',
      brand: 'Sony',
      stock: 18,
      amazing: true,
      tag: 'amazing',
      description: 'هدفون با حذف نویز فعال، مکالمه واضح و شارژ سریع. مناسب سفر و کار روزانه.'
    },
    {
      id: 'p3',
      title: 'ساعت هوشمند Pro Series',
      price: 6900000,
      old: 8200000,
      discount: 16,
      icon: 'bi-watch',
      rating: 4.6,
      reviews: 890,
      category: 'digital',
      brand: 'Xiaomi',
      stock: 30,
      tag: 'special',
      description: 'پایش سلامت، GPS و مقاومت در برابر آب. همراه با بندهای قابل تعویض.'
    },
    {
      id: 'p4',
      title: 'لپ‌تاپ ۱۳ اینچ سبک',
      price: 42900000,
      old: 47500000,
      discount: 10,
      icon: 'bi-laptop',
      rating: 4.8,
      reviews: 312,
      category: 'digital',
      brand: 'ASUS',
      stock: 9,
      tag: 'special',
      description: 'لپ‌تاپ فوق سبک برای کار و تحصیل، پردازنده قدرتمند و باتری طولانی‌مدت.'
    },
    {
      id: 'p5',
      title: 'قهوه‌ساز اتوماتیک',
      price: 9800000,
      old: 11500000,
      discount: 15,
      icon: 'bi-cup-hot',
      rating: 4.4,
      reviews: 221,
      category: 'home',
      brand: 'Delonghi',
      stock: 14,
      amazing: true,
      tag: 'amazing',
      description: 'آسیاب داخلی، کف‌شیر شیر و برنامه‌های متنوع برای اسپرسو و کاپوچینو.'
    },
    {
      id: 'p6',
      title: 'کفش ورزشی رانینگ',
      price: 3200000,
      old: 4100000,
      discount: 22,
      icon: 'bi-lightning',
      rating: 4.3,
      reviews: 540,
      category: 'sport',
      brand: 'Adidas',
      stock: 40,
      tag: 'sale',
      description: 'کفش سبک با کفی نرم برای دویدن روزمره و تمرینات هوازی.'
    },
    {
      id: 'p7',
      title: 'عطر مردانه ۱۰۰ میل',
      price: 2750000,
      old: 3400000,
      discount: 19,
      icon: 'bi-droplet',
      rating: 4.6,
      reviews: 760,
      category: 'beauty',
      brand: 'Dior',
      stock: 22,
      tag: 'special',
      description: 'رایحه گرم و ماندگار، مناسب استفاده روزانه و مهمانی.'
    },
    {
      id: 'p8',
      title: 'کنسول بازی نسل جدید',
      price: 28900000,
      old: 31500000,
      discount: 8,
      icon: 'bi-controller',
      rating: 4.9,
      reviews: 1502,
      category: 'gaming',
      brand: 'Sony',
      stock: 7,
      amazing: true,
      tag: 'amazing',
      description: 'کنسول قدرتمند با گرافیک نسل جدید و پشتیبانی از بازی‌های 4K.'
    },
    {
      id: 'p9',
      title: 'جارو رباتیک هوشمند',
      price: 15400000,
      old: 17900000,
      discount: 14,
      icon: 'bi-robot',
      rating: 4.5,
      reviews: 433,
      category: 'home',
      brand: 'Xiaomi',
      stock: 11,
      tag: 'sale',
      description: 'نقشه‌برداری هوشمند، کنترل از اپلیکیشن و قدرت مکش بالا.'
    },
    {
      id: 'p10',
      title: 'دوربین اکشن ۴K',
      price: 7800000,
      old: 9200000,
      discount: 15,
      icon: 'bi-camera',
      rating: 4.4,
      reviews: 198,
      category: 'digital',
      brand: 'GoPro',
      stock: 16,
      tag: 'special',
      description: 'ضدآب، لرزشگیر پیشرفته و کیفیت تصویر 4K برای ماجراجویی.'
    },
    {
      id: 'p11',
      title: 'مانتو بهاره زنانه',
      price: 2100000,
      old: 2800000,
      discount: 25,
      icon: 'bi-handbag',
      rating: 4.2,
      reviews: 97,
      category: 'fashion',
      brand: 'Local',
      stock: 35,
      tag: 'sale',
      description: 'پارچه سبک و خنک، مناسب فصل بهار و تابستان.'
    },
    {
      id: 'p12',
      title: 'کرم مرطوب‌کننده پوست',
      price: 890000,
      old: 1200000,
      discount: 26,
      icon: 'bi-heart-pulse',
      rating: 4.7,
      reviews: 1104,
      category: 'beauty',
      brand: 'CeraVe',
      stock: 50,
      amazing: true,
      tag: 'amazing',
      description: 'آبرسان روزانه مناسب پوست خشک و حساس با ترکیبات ترمیم‌کننده.'
    }
  ];

  let PRODUCTS = DEMO_PRODUCTS.slice();

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

  const getProduct = (id) =>
    PRODUCTS.find((p) => String(p.id) === String(id)) || null;

  const getByCategory = (catId) =>
    PRODUCTS.filter((p) => String(p.category) === String(catId));

  const mapApiProduct = (dto, index = 0) => {
    const price = Number(dto.price) || 0;
    const stock = Number(dto.stock) || 0;
    let tag = '';
    let amazing = false;
    let discount = 0;
    let old = null;
    if (stock > 0 && stock <= 5) {
      tag = 'amazing';
      amazing = true;
      discount = 15;
      old = Math.round(price * 1.15);
    } else if (price >= 10000000) {
      tag = 'special';
      discount = 10;
      old = Math.round(price * 1.1);
    } else if (stock === 0) {
      tag = 'sale';
      discount = 20;
      old = Math.round(price * 1.2);
    }

    return {
      id: String(dto.id),
      title: dto.name || 'محصول',
      price,
      old,
      discount,
      icon: ICONS[index % ICONS.length],
      imageUrl: dto.imageUrl || dto.ImageUrl || '',
      thumbnailUrl: dto.thumbnailUrl || dto.ThumbnailUrl || dto.imageUrl || dto.ImageUrl || '',
      gallery: Array.isArray(dto.gallery) ? dto.gallery : (Array.isArray(dto.Gallery) ? dto.Gallery : []),
      rating: 4.5,
      reviews: Math.max(12, (dto.id * 17) % 900),
      category: String(dto.categoryId ?? ''),
      brand: dto.supplierName || dto.categoryName || 'SimpleShop',
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

  const loadFromApi = async () => {
    if (!Store.config?.USE_API || !Store.api) return false;
    const [paged, cats] = await Promise.all([
      Store.api.getProducts({ page: 1, pageSize: 48, sortBy: 'name', sortDir: 'asc' }),
      Store.api.getCategories()
    ]);
    const items = paged?.items || paged?.Items || [];
    if (!Array.isArray(items) || !items.length) return false;

    PRODUCTS = items.map((dto, i) => mapApiProduct(dto, i));
    if (Array.isArray(cats) && cats.length) {
      CATEGORIES = cats.map((c, i) => ({
        id: String(c.id ?? c.Id),
        name: c.name || c.Name || `دسته ${i + 1}`,
        icon: ICONS[i % ICONS.length]
      }));
    }
    source = 'api';
    refreshCategoryNav();
    document.dispatchEvent(new CustomEvent('catalog:ready', { detail: { source } }));
    return true;
  };

  const categoryHref = (catId) => `category.html?id=${encodeURIComponent(String(catId))}`;

  const refreshCategoryNav = () => {
    const catCol = document.querySelector('.mega-col.categories');
    if (catCol && CATEGORIES.length) {
      catCol.innerHTML = CATEGORIES.slice(0, 8).map((c, i) => `
        <a class="mega-cat${i === 0 ? ' active' : ''}" href="${categoryHref(c.id)}" data-panel="${escapeHtml(String(c.id))}">
          <i class="bi ${escapeHtml(c.icon || 'bi-grid')}"></i> ${escapeHtml(c.name)}
        </a>`).join('');
      Store.layout?.initMegaMenuHover?.();
    }

    document.querySelectorAll('[data-category-link]').forEach((el) => {
      const catId = el.dataset.categoryLink;
      if (catId) el.setAttribute('href', categoryHref(catId));
    });

    document.querySelectorAll('.mega-nav-list a[href*="cat="]').forEach((el) => {
      el.setAttribute('href', 'category.html');
    });

    const catStrip = document.querySelector('.cat-strip');
    if (catStrip && CATEGORIES.length) {
      catStrip.innerHTML = CATEGORIES.slice(0, 8).map((c) => `
        <a href="${categoryHref(c.id)}" class="cat-chip">
          <i class="bi ${escapeHtml(c.icon || 'bi-grid')}"></i><span>${escapeHtml(c.name)}</span>
        </a>`).join('');
    }
  };

  const ready = (async () => {
    try {
      if (Store.config?.USE_API) {
        const ok = await loadFromApi();
        if (ok) return { source };
      }
    } catch (err) {
      console.warn('[VisitorPanel] API unavailable, using demo catalog.', err);
    }
    PRODUCTS = DEMO_PRODUCTS.slice();
    CATEGORIES = DEMO_CATEGORIES.slice();
    source = 'demo';
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
    discount: p.discount || 0,
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
          discount: row.discount || 0,
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
      ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(p.title)}" loading="lazy" width="320" height="320">`
      : `<i class="bi ${escapeHtml(p.icon || 'bi-box-seam')}"></i>`;
    return `
    <article class="product-card" data-product-id="${escapeHtml(p.id)}">
      <a href="product.html?id=${encodeURIComponent(p.id)}" class="product-link">
        <div class="product-thumb">
          ${p.discount ? `<span class="product-badge">٪${p.discount}</span>` : ''}
          ${tagHtml(p)}
          ${media}
        </div>
        <h3>${escapeHtml(p.title)}</h3>
      </a>
      <div class="product-meta">
        <div class="price-block">
          ${p.old ? `<span class="old">${formatPrice(p.old)}</span>` : ''}
          <span class="now">${formatPrice(p.price)}</span>
        </div>
        <span class="rating"><i class="bi bi-star-fill"></i> ${p.rating}</span>
      </div>
      <button type="button" class="add-btn ${deal || p.amazing ? 'add-btn-amazing' : ''}" data-add="${escapeHtml(p.id)}">
        ${deal || p.amazing ? 'خرید شگفت‌انگیز' : 'افزودن به سبد'}
      </button>
    </article>
  `;
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
    get source() { return source; },
    TAG_LABELS,
    ready,
    loadFromApi,
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
    formatDate,
    formatDateTime,
    productCard,
    tagHtml,
    bindAddButtons,
    showToast
  };
})(window.SimpleStore = window.SimpleStore || {});
