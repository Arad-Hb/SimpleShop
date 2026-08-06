(function (Store) {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    await Store.catalog.ready;
    const { escapeHtml, formatPrice, tagHtml, productCard, bindAddButtons, showToast } = Store.ui;
    const { getProduct, getRelated, CATEGORIES, TAG_LABELS, mapApiProduct } = Store.catalog;
    const id = new URLSearchParams(location.search).get('id');
    let product = getProduct(id);
    const root = document.getElementById('product-root');

    // Prefer full API product (gallery + SEO images) when available
    if (Store.config?.USE_API && Store.api?.getProduct && id) {
      try {
        const dto = await Store.api.getProduct(id);
        if (dto) {
          const mapped = (Store.catalog.mapApiProduct || mapApiProduct)?.(dto, 0)
            || (() => {
              const base = getProduct(id) || {};
              return {
                ...base,
                id: String(dto.id),
                title: dto.name || base.title,
                price: Number(dto.price) || base.price,
                stock: Number(dto.stock) || base.stock,
                description: dto.description || base.description,
                imageUrl: dto.imageUrl || '',
                thumbnailUrl: dto.thumbnailUrl || dto.imageUrl || '',
                gallery: dto.gallery || [],
                icon: base.icon || 'bi-box-seam',
                rating: base.rating || 4.5,
                reviews: base.reviews || 100,
                category: String(dto.categoryId ?? base.category ?? ''),
                brand: dto.supplierName || dto.categoryName || base.brand || 'SimpleShop',
                tag: base.tag || '',
                amazing: base.amazing || false,
                discount: base.discount || 0,
                old: base.old || null
              };
            })();
          product = mapped;
        }
      } catch {
        // keep catalog product
      }
    }

    if (!product || !root) {
      if (root) {
        root.innerHTML = `
          <div class="panel-card empty-cart">
            <i class="bi bi-emoji-frown"></i>
            <p>محصول یافت نشد.</p>
            <a href="index.html" class="btn btn-primary mt-2">بازگشت به فروشگاه</a>
          </div>`;
      }
      return;
    }

    const cat = CATEGORIES.find((c) => c.id === product.category);
    let qty = 1;
    const mediaUrl = (path) => (Store.api?.mediaUrl ? Store.api.mediaUrl(path) : path);

    const galleryItems = (product.gallery || [])
      .map((g) => ({
        url: mediaUrl(g.url || g.Url || ''),
        thumb: mediaUrl(g.thumbnailUrl || g.ThumbnailUrl || g.url || g.Url || ''),
        alt: g.altText || g.AltText || product.title
      }))
      .filter((g) => g.url);

    if (!galleryItems.length && (product.imageUrl || product.thumbnailUrl)) {
      const url = mediaUrl(product.imageUrl || product.thumbnailUrl);
      galleryItems.push({ url, thumb: mediaUrl(product.thumbnailUrl || product.imageUrl), alt: product.title });
    }

    const mainSrc = galleryItems[0]?.url || '';
    const galleryHtml = mainSrc
      ? `<img class="main-photo" id="main-photo" src="${escapeHtml(mainSrc)}" alt="${escapeHtml(product.title)}">
         ${galleryItems.length > 1 ? `<div class="product-gallery-thumbs">${galleryItems.map((g, i) => `
            <button type="button" class="${i === 0 ? 'active' : ''}" data-full="${escapeHtml(g.url)}" aria-label="تصویر ${i + 1}">
              <img src="${escapeHtml(g.thumb)}" alt="">
            </button>`).join('')}</div>` : ''}`
      : `<i class="bi ${escapeHtml(product.icon || 'bi-box-seam')}"></i>`;

    if (product.metaTitle) document.title = product.metaTitle;

    root.innerHTML = `
      <div class="crumb">
        <a href="index.html">خانه</a> /
        <a href="category.html?id=${escapeHtml(product.category)}">${escapeHtml(cat?.name || 'دسته')}</a> /
        <span>${escapeHtml(product.title)}</span>
      </div>
      <div class="product-detail">
        <div class="product-gallery">
          ${tagHtml(product)}
          ${product.discount ? `<span class="product-badge" style="position:absolute;top:16px;left:16px">٪${product.discount}</span>` : ''}
          ${galleryHtml}
        </div>
        <div class="product-detail-info panel-card">
          ${product.tag ? `<div class="mb-2">${tagHtml(product)}</div>` : ''}
          <div class="text-muted small">${escapeHtml(product.brand)} · ${escapeHtml(cat?.name || '')}</div>
          <h1>${escapeHtml(product.title)}</h1>
          <div class="detail-meta">
            <span><i class="bi bi-star-fill text-warning"></i> ${product.rating} (${product.reviews.toLocaleString('fa-IR')} نظر)</span>
            <span><i class="bi bi-box-seam"></i> موجودی: ${product.stock.toLocaleString('fa-IR')}</span>
          </div>
          <div class="detail-price">
            <span class="now">${formatPrice(product.price)}</span>
            ${product.old ? `<span class="old">${formatPrice(product.old)}</span>` : ''}
            ${product.discount ? `<span class="off">${product.discount}٪ تخفیف</span>` : ''}
          </div>
          <p class="text-muted">${escapeHtml(product.description)}</p>
          <div class="qty-row">
            <span class="fw-bold">تعداد:</span>
            <div class="qty-box">
              <button type="button" id="qty-minus">−</button>
              <span id="qty-val">۱</span>
              <button type="button" id="qty-plus">+</button>
            </div>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-primary btn-lg px-4" id="btn-add-card">افزودن به کارت</button>
            ${product.amazing || product.tag === 'amazing'
              ? `<button type="button" class="btn-amazing" id="btn-amazing">خرید شگفت‌انگیز</button>`
              : ''}
            <a href="card.html" class="btn btn-outline-secondary btn-lg">مشاهده کارت</a>
          </div>
        </div>
      </div>
      <section class="section-block mt-4">
        <div class="section-head">
          <h2>محصولات مرتبط</h2>
        </div>
        <div class="product-grid" id="related-grid"></div>
      </section>
    `;

    root.querySelectorAll('.product-gallery-thumbs button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const full = btn.dataset.full;
        const main = document.getElementById('main-photo');
        if (main && full) main.src = full;
        root.querySelectorAll('.product-gallery-thumbs button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    const qtyEl = document.getElementById('qty-val');
    const syncQty = () => { qtyEl.textContent = qty.toLocaleString('fa-IR'); };
    document.getElementById('qty-minus')?.addEventListener('click', () => {
      qty = Math.max(1, qty - 1);
      syncQty();
    });
    document.getElementById('qty-plus')?.addEventListener('click', () => {
      qty = Math.min(Math.max(product.stock, 1), qty + 1);
      syncQty();
    });

    const add = () => {
      Store.card.addToCard(product.id, qty);
      showToast(`${TAG_LABELS[product.tag] ? '✓ ' : ''}به کارت اضافه شد`);
    };
    document.getElementById('btn-add-card')?.addEventListener('click', add);
    document.getElementById('btn-amazing')?.addEventListener('click', add);

    const related = getRelated(product, 4);
    const grid = document.getElementById('related-grid');
    if (grid) {
      grid.innerHTML = related.length
        ? related.map((p) => productCard(p)).join('')
        : '<p class="text-muted">محصول مرتبطی یافت نشد.</p>';
      bindAddButtons(grid);
    }
  });
})(window.SimpleStore = window.SimpleStore || {});
