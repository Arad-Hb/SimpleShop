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
    }

    document.querySelectorAll('[data-category-link]').forEach((el) => {
      const catId = el.dataset.categoryLink;
      if (catId) el.setAttribute('href', categoryHref(catId));
    });

    document.querySelectorAll('.mega-nav-list a[href*="cat="]').forEach((el) => {
      el.setAttribute('href', 'category.html');
    });
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

  const initMegaMenu = () => {
    document.querySelectorAll('.mega-cat').forEach((btn) => {
      btn.addEventListener('mouseenter', () => {
        document.querySelectorAll('.mega-cat').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const id = btn.dataset.panel;
        document.querySelectorAll('.mega-col.links').forEach((col) => {
          col.classList.toggle('d-none', col.id !== `mega-panel-${id}`);
        });
      });
    });
  };

  const initSearchForms = () => {
    document.querySelectorAll('[data-store-search]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = form.querySelector('input[type="search"], input[name="q"]')?.value || '';
        window.location.href = `search.html?q=${encodeURIComponent(q.trim())}`;
      });
    });
  };

  const initDealTimer = () => {
    const timer = document.getElementById('deal-timer');
    if (!timer) return;
    let total = 12 * 3600 + 45 * 60 + 33;
    const tick = () => {
      if (total <= 0) total = 12 * 3600;
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      const pad = (n) => String(n).padStart(2, '0');
      timer.innerHTML = `<span>${pad(h)}</span>:<span>${pad(m)}</span>:<span>${pad(s)}</span>`;
      total -= 1;
    };
    tick();
    setInterval(tick, 1000);
  };

  const headerHTML = () => `
  <div class="preview-banner">فروشگاه آزمایشی SimpleShop — کارت خرید و صفحات محصول فعال است</div>
  <div class="top-bar">
    <div class="container-xxl d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div class="d-flex align-items-center gap-3 flex-wrap top-bar-links">
        <a href="index.html"><i class="bi bi-geo-alt"></i> ارسال به تهران</a>
        <a href="login.html"><i class="bi bi-headset"></i> پشتیبانی</a>
      </div>
      <div class="d-flex align-items-center gap-3 flex-wrap top-bar-links">
        <a href="login.html"><i class="bi bi-box-arrow-in-left"></i> ورود / ثبت‌نام</a>
        <a href="card.html"><i class="bi bi-truck"></i> کارت و سفارش</a>
      </div>
    </div>
  </div>
  <header class="main-header">
    <div class="container-xxl">
      <div class="header-row">
        <a href="index.html" class="brand">
          <span class="brand-mark"><i class="bi bi-bag-heart-fill"></i></span>
          <span class="brand-text"><strong>SimpleShop</strong><small>فروشگاه اینترنتی</small></span>
        </a>
        <form class="search-box" data-store-search role="search">
          <i class="bi bi-search"></i>
          <input type="search" name="q" placeholder="جستجو در محصولات، برندها و دسته‌ها..." aria-label="جستجو">
          <button type="submit" class="btn-search">جستجو</button>
        </form>
        <div class="header-actions">
          <a href="amazing.html" class="action-btn action-amazing" title="شگفت‌انگیزها">
            <i class="bi bi-lightning-charge-fill"></i>
          </a>
          <a href="card.html" class="action-btn cart-btn" title="کارت خرید">
            <i class="bi bi-credit-card-2-front"></i>
            <span class="cart-badge" data-card-count data-cart-count>0</span>
            <span class="cart-meta d-none d-lg-inline">
              <small>کارت خرید</small>
              <strong data-card-total data-cart-total>۰ ت</strong>
            </span>
          </a>
        </div>
      </div>
    </div>
  </header>
  <nav class="mega-nav">
    <div class="container-xxl">
      <ul class="mega-nav-list">
        <li class="mega-item">
          <a href="category.html" class="mega-trigger"><i class="bi bi-grid"></i> دسته‌بندی کالاها <i class="bi bi-chevron-down"></i></a>
          <div class="mega-panel">
            <div class="mega-cols">
              <div class="mega-col categories">
                <a class="mega-cat active" href="category.html?id=digital" data-panel="digital"><i class="bi bi-phone"></i> کالای دیجیتال</a>
                <a class="mega-cat" href="category.html?id=home" data-panel="home"><i class="bi bi-house"></i> خانه و آشپزخانه</a>
                <a class="mega-cat" href="category.html?id=fashion" data-panel="fashion"><i class="bi bi-handbag"></i> مد و پوشاک</a>
                <a class="mega-cat" href="category.html?id=beauty" data-panel="beauty"><i class="bi bi-flower1"></i> زیبایی و سلامت</a>
                <a class="mega-cat" href="category.html?id=sport" data-panel="sport"><i class="bi bi-trophy"></i> ورزش و سفر</a>
                <a class="mega-cat" href="category.html?id=gaming" data-panel="gaming"><i class="bi bi-controller"></i> گیمینگ</a>
              </div>
              <div class="mega-col links" id="mega-panel-digital">
                <h6>میانبرها</h6>
                <a href="category.html?id=digital">همه کالای دیجیتال</a>
                <a href="amazing.html" class="text-amazing-link">پیشنهادهای شگفت‌انگیز</a>
                <a href="search.html?q=Samsung">برند Samsung</a>
                <a href="search.html?q=Sony">برند Sony</a>
              </div>
              <div class="mega-col promo">
                <div class="mega-promo-card">
                  <span class="offer-tag tag-amazing">پیشنهاد شگفت‌انگیز</span>
                  <strong>تا ۴۰٪ تخفیف منتخب‌ها</strong>
                  <a href="amazing.html">مشاهده همه</a>
                </div>
              </div>
            </div>
          </div>
        </li>
        <li><a href="amazing.html" class="nav-amazing"><i class="bi bi-lightning-charge-fill"></i> شگفت‌انگیزها</a></li>
        <li><a href="category.html">همه محصولات</a></li>
        <li><a href="category.html?id=digital">پرفروش‌ها</a></li>
        <li><a href="search.html?q=%D9%81%D8%B1%D9%88%D8%B4">تخفیف‌ها</a></li>
        <li class="ms-auto d-none d-xl-block"><a href="checkout.html" class="mega-highlight"><i class="bi bi-bag-check"></i> تکمیل خرید</a></li>
      </ul>
    </div>
  </nav>`;

  const footerHTML = () => `
  <footer class="site-footer">
    <div class="container-xxl">
      <div class="footer-top">
        <div class="footer-brand">
          <div class="brand">
            <span class="brand-mark"><i class="bi bi-bag-heart-fill"></i></span>
            <span class="brand-text"><strong>SimpleShop</strong><small>خرید مطمئن، ارسال سریع</small></span>
          </div>
          <p>فروشگاه اینترنتی SimpleShop — پیش‌نمایش کامل فروشگاهی با کارت خرید و صفحه محصول.</p>
          <div class="socials">
            <a href="#" aria-label="اینستاگرام"><i class="bi bi-instagram"></i></a>
            <a href="#" aria-label="تلگرام"><i class="bi bi-telegram"></i></a>
            <a href="#" aria-label="یوتیوب"><i class="bi bi-youtube"></i></a>
          </div>
        </div>
        <div>
          <h5>فروشگاه</h5>
          <a href="index.html">صفحه اصلی</a>
          <a href="category.html">محصولات</a>
          <a href="amazing.html">شگفت‌انگیزها</a>
          <a href="card.html">کارت خرید</a>
        </div>
        <div>
          <h5>حساب کاربری</h5>
          <a href="login.html">ورود / ثبت‌نام</a>
          <a href="checkout.html">تسویه حساب</a>
        </div>
        <div>
          <h5>راهنما</h5>
          <a href="category.html">دسته‌بندی‌ها</a>
          <a href="search.html">جستجو</a>
        </div>
        <div class="footer-contact">
          <h5>ارتباط با ما</h5>
          <p><i class="bi bi-telephone"></i> ۰۲۱-۹۱۰۰۰۰۰۰</p>
          <p><i class="bi bi-envelope"></i> support@simpleshop.ir</p>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ۱۴۰۴ SimpleShop</span>
        <span class="preview-note">Visitor UI preview</span>
      </div>
    </div>
  </footer>`;

  const mountShell = () => {
    const top = document.querySelector('[data-shell-top]');
    const bottom = document.querySelector('[data-shell-bottom]');
    if (top) top.innerHTML = headerHTML();
    if (bottom) bottom.innerHTML = footerHTML();
  };

  const boot = () => {
    mountShell();
    notifyIfStoredCardExpired();
    updateCardUI();
    initMegaMenu();
    initSearchForms();
    initDealTimer();
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
    showToast,
    mountShell
  };
})(window.SimpleStore = window.SimpleStore || {});
