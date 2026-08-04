/**
 * products.js — صفحه فهرست محصولات
 */
(function (ShopAdmin) {
  'use strict';

  if (!ShopAdmin.auth.requireAuth()) return;

  const {
    escapeHtml, formatPrice, formatDateTime, getStockBadge, getStatusBadge, debounce, parseQuery
  } = ShopAdmin.utils;
  const { paginate, sortItems } = ShopAdmin.pagination;
  const { getProductStockStatus } = ShopAdmin.storage;

  const productRepo = ShopAdmin.storage.createRepository('products');
  const categoryRepo = ShopAdmin.storage.createRepository('categories');
  const supplierRepo = ShopAdmin.storage.createRepository('suppliers');
  const orderItemRepo = ShopAdmin.storage.createRepository('orderItems');
  const { imageStore } = ShopAdmin.storage;

  const thumbCache = new Map();

  const state = {
    page: 1,
    pageSize: 10,
    sortField: 'createdAt',
    sortDir: 'desc',
    filters: {}
  };

  const normalizeProduct = (p) => {
    const product = { ...p };
    if (!Array.isArray(product.images)) {
      product.images = product.imageId
        ? [{ id: product.imageId, alt: product.name || '', isPrimary: true, sortOrder: 0 }]
        : [];
    }
    if (!product.seo) {
      product.seo = {
        metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '',
        ogTitle: '', ogDescription: '', ogImageId: null, index: true, follow: true
      };
    }
    return product;
  };

  const getPrimaryImageId = (product) => {
    const images = product.images || [];
    const primary = images.find((img) => img.isPrimary);
    return primary?.id ?? images[0]?.id ?? product.imageId ?? null;
  };

  const loadThumbUrl = async (productOrImageId) => {
    // Prefer remote API/thumbnail URLs when product object is passed
    if (productOrImageId && typeof productOrImageId === 'object') {
      const p = productOrImageId;
      const remote = p.thumbnailUrl || p.imageUrl
        || p.images?.find((i) => i.isPrimary)?.thumbnailUrl
        || p.images?.find((i) => i.isPrimary)?.url
        || p.images?.[0]?.thumbnailUrl
        || p.images?.[0]?.url;
      if (remote && ShopAdmin.api?.mediaUrl) {
        const url = ShopAdmin.api.mediaUrl(remote);
        if (url) return url;
      }
      productOrImageId = getPrimaryImageId(p);
    }

    const imageId = productOrImageId;
    if (!imageId) return null;
    if (thumbCache.has(imageId)) return thumbCache.get(imageId);

    // Remote id placeholder from API sync: try matching product images
    const product = productRepo.getAll().find((p) =>
      p.imageId === imageId || (p.images || []).some((i) => i.id === imageId)
    );
    if (product) {
      const imgMeta = (product.images || []).find((i) => i.id === imageId);
      const remote = imgMeta?.thumbnailUrl || imgMeta?.url || product.thumbnailUrl || product.imageUrl;
      if (remote && ShopAdmin.api?.mediaUrl) {
        const url = ShopAdmin.api.mediaUrl(remote);
        thumbCache.set(imageId, url);
        return url;
      }
    }

    try {
      const blob = await imageStore.getImage(imageId);
      if (!blob) return null;
      const url = URL.createObjectURL(blob);
      thumbCache.set(imageId, url);
      return url;
    } catch {
      return null;
    }
  };

  const getCategoryMap = () => {
    const map = new Map();
    categoryRepo.getAll().forEach((c) => map.set(c.id, c.name));
    return map;
  };

  const getSupplierMap = () => {
    const map = new Map();
    supplierRepo.getAll().forEach((s) => map.set(s.id, s.name));
    return map;
  };

  const productHasOrders = (productId) =>
    orderItemRepo.getAll().some((item) => item.productId === productId);

  const applyFilters = (products) => {
    const f = state.filters;
    let list = products.map(normalizeProduct);

    if (f.search) {
      const q = f.search.toLowerCase();
      list = list.filter((p) => (p.name || '').toLowerCase().includes(q));
    }
    if (f.sku) {
      const q = f.sku.toLowerCase();
      list = list.filter((p) => (p.sku || '').toLowerCase().includes(q));
    }
    if (f.categoryId) {
      list = list.filter((p) => p.categoryId === Number(f.categoryId));
    }
    if (f.supplierId) {
      list = list.filter((p) => p.supplierId === Number(f.supplierId));
    }
    if (f.priceMin !== '' && f.priceMin != null) {
      const min = Number(f.priceMin);
      list = list.filter((p) => (Number(p.price) || 0) >= min);
    }
    if (f.priceMax !== '' && f.priceMax != null) {
      const max = Number(f.priceMax);
      list = list.filter((p) => (Number(p.price) || 0) <= max);
    }
    if (f.stockMin !== '' && f.stockMin != null) {
      const min = Number(f.stockMin);
      list = list.filter((p) => (Number(p.stock) || 0) >= min);
    }
    if (f.stockMax !== '' && f.stockMax != null) {
      const max = Number(f.stockMax);
      list = list.filter((p) => (Number(p.stock) || 0) <= max);
    }
    if (f.stockStatus) {
      list = list.filter((p) => getProductStockStatus(p) === f.stockStatus);
    }
    if (f.activeStatus === 'active') {
      list = list.filter((p) => p.isActive !== false);
    } else if (f.activeStatus === 'inactive') {
      list = list.filter((p) => p.isActive === false);
    }
    if (f.minRating) {
      const min = Number(f.minRating);
      list = list.filter((p) => (Number(p.rating) || 0) >= min);
    }

    return list;
  };

  const parseSort = (sortVal) => {
    if (!sortVal) return { field: 'createdAt', dir: 'desc' };
    const [field, dir] = sortVal.split('-');
    return { field: field || 'createdAt', dir: dir === 'asc' ? 'asc' : 'desc' };
  };

  const readFiltersFromForm = () => {
    const form = document.getElementById('filter-form');
    if (!form) return;
    const fd = new FormData(form);
    state.filters = Object.fromEntries(fd.entries());
    const sort = parseSort(state.filters.sort);
    state.sortField = sort.field;
    state.sortDir = sort.dir;
    state.pageSize = Number(state.filters.pageSize) || 10;
  };

  const populateFilterDropdowns = () => {
    const catSel = document.getElementById('filter-category');
    const supSel = document.getElementById('filter-supplier');
    if (!catSel || !supSel) return;

    const keepCat = catSel.value;
    const keepSup = supSel.value;
    catSel.innerHTML = '<option value="">همه</option>';
    supSel.innerHTML = '<option value="">همه</option>';

    categoryRepo.getAll()
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name}${c.isActive === false ? ' (غیرفعال)' : ''}`;
        catSel.appendChild(opt);
      });

    supplierRepo.getAll().forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name}${s.isActive === false ? ' (غیرفعال)' : ''}`;
      supSel.appendChild(opt);
    });

    if (keepCat) catSel.value = keepCat;
    if (keepSup) supSel.value = keepSup;
  };

  const renderPriceCell = (product) => {
    const price = Number(product.price) || 0;
    const discount = product.discountPrice != null ? Number(product.discountPrice) : null;
    if (discount != null && discount < price) {
      return `<div><span class="text-decoration-line-through text-muted small">${escapeHtml(formatPrice(price))}</span><br><span class="text-success fw-semibold">${escapeHtml(formatPrice(discount))}</span></div>`;
    }
    return escapeHtml(formatPrice(price));
  };

  const renderTable = async () => {
    const tbody = document.getElementById('products-tbody');
    const container = document.getElementById('table-container');
    if (!tbody) return;

    ShopAdmin.ui.showLoading(container);

    const categories = getCategoryMap();
    const suppliers = getSupplierMap();
    let products = applyFilters(productRepo.getAll());
    products = sortItems(products, state.sortField, state.sortDir);

    const pageSize = state.pageSize || 10;
    const result = paginate(products, state.page, pageSize);

    document.getElementById('results-count').textContent =
      `${result.totalItems.toLocaleString('fa-IR')} محصول`;
    document.getElementById('pagination-info').textContent =
      `صفحه ${result.page.toLocaleString('fa-IR')} از ${result.totalPages.toLocaleString('fa-IR')}`;

    if (result.items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="12" class="text-center py-5 text-muted">
            <i class="bi bi-box-seam display-6 d-block mb-2 opacity-50"></i>
            <p class="mb-2">محصولی یافت نشد</p>
            <a href="product-form.html" class="btn btn-sm btn-primary">افزودن محصول</a>
          </td>
        </tr>`;
      document.getElementById('pagination').innerHTML = '';
      ShopAdmin.ui.hideLoading(container);
      return;
    }

    tbody.innerHTML = result.items.map((p) => `
      <tr data-id="${p.id}">
        <td class="col-img"><img class="table-img" data-product-id="${p.id}" alt="${escapeHtml(p.name || '')}" src="" width="40" height="40"></td>
        <td class="col-id">${p.id.toLocaleString('fa-IR')}</td>
        <td class="col-sku"><code>${escapeHtml(p.sku)}</code></td>
        <td class="col-name"><span class="product-name-cell" title="${escapeHtml(p.name || '')}">${escapeHtml(p.name)}</span></td>
        <td class="col-cat">${escapeHtml(p.categoryName || categories.get(p.categoryId) || '—')}</td>
        <td class="col-supplier">${escapeHtml(p.supplierName || suppliers.get(p.supplierId) || '—')}</td>
        <td class="col-price">${renderPriceCell(p)}</td>
        <td class="col-stock">${(Number(p.stock) || 0).toLocaleString('fa-IR')}</td>
        <td class="col-min">${(Number(p.minimumStock) ?? 5).toLocaleString('fa-IR')}</td>
        <td class="col-stock-status">${getStockBadge(p)}</td>
        <td class="col-publish">${getStatusBadge(p.isActive !== false ? 'active' : 'inactive')}</td>
        <td class="col-actions">
          <div class="table-actions product-actions">
            <a href="product-form.html?id=${p.id}" class="btn btn-outline-primary" title="ویرایش" aria-label="ویرایش"><i class="bi bi-pencil"></i></a>
            <button type="button" class="btn btn-outline-secondary btn-toggle-active" title="تغییر وضعیت" aria-label="تغییر وضعیت">
              <i class="bi bi-${p.isActive !== false ? 'pause' : 'play'}-circle"></i>
            </button>
            <button type="button" class="btn btn-outline-danger btn-delete" title="حذف" aria-label="حذف"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    const placeholder = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="#e2e8f0" width="40" height="40"/><text x="50%" y="55%" text-anchor="middle" fill="#94a3b8" font-size="10">—</text></svg>');
    await Promise.all([...tbody.querySelectorAll('img.table-img')].map(async (img) => {
      const product = result.items.find((p) => String(p.id) === String(img.dataset.productId));
      const url = product ? await loadThumbUrl(product) : null;
      img.src = url || placeholder;
      img.loading = 'lazy';
    }));

    bindRowActions();
    ShopAdmin.ui.renderPagination(document.getElementById('pagination'), result.page, result.totalPages, (page) => {
      state.page = page;
      renderTable();
    });

    ShopAdmin.ui.hideLoading(container);
  };

  const bindRowActions = () => {
    document.querySelectorAll('#products-tbody tr').forEach((row) => {
      const id = Number(row.dataset.id);
      row.querySelector('.btn-toggle-active')?.addEventListener('click', () => toggleActive(id));
      row.querySelector('.btn-delete')?.addEventListener('click', () => deleteProduct(id));
    });
  };

  const toggleActive = (id) => {
    const product = productRepo.getById(id);
    if (!product) return;
    const next = product.isActive === false;
    productRepo.update(id, { isActive: next });
    ShopAdmin.ui.showToast('success', next ? 'محصول فعال شد.' : 'محصول غیرفعال شد.');
    renderTable();
  };

  const deleteProductImages = async (product) => {
    const normalized = normalizeProduct(product);
    const ids = [...new Set([
      ...(normalized.images || []).map((img) => img.id),
      normalized.seo?.ogImageId,
      product.imageId
    ].filter(Boolean))];
    await Promise.all(ids.map((imgId) => imageStore.deleteImage(imgId).catch(() => {})));
  };

  const deleteProduct = (id) => {
    const product = productRepo.getById(id);
    if (!product) return;

    if (productHasOrders(id)) {
      ShopAdmin.ui.showConfirmModal(
        'غیرفعال‌سازی محصول',
        'این محصول در سفارش‌ها استفاده شده و قابل حذف نیست. آیا می‌خواهید آن را غیرفعال کنید؟',
        () => {
          productRepo.update(id, { isActive: false });
          ShopAdmin.ui.showToast('warning', 'محصول غیرفعال شد.');
          renderTable();
        }
      );
      return;
    }

    ShopAdmin.ui.showConfirmModal(
      'حذف محصول',
      `آیا از حذف «${product.name}» مطمئن هستید؟`,
      async () => {
        await deleteProductImages(product);
        productRepo.remove(id);
        ShopAdmin.ui.showToast('success', 'محصول حذف شد.');
        renderTable();
      }
    );
  };

  const clearFilters = () => {
    document.getElementById('filter-form')?.reset();
    state.page = 1;
    readFiltersFromForm();
    renderTable();
  };

  const init = async () => {
    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'محصولات' }
    ]);

    // Wait for API catalog sync so the table shows DB products + photos
    if (typeof ShopAdmin.sync?.syncCatalogFromApi === 'function') {
      await ShopAdmin.sync.syncCatalogFromApi();
    }

    populateFilterDropdowns();

    const query = parseQuery();
    if (query.supplierId) {
      const supplierSelect = document.getElementById('filter-supplier');
      if (supplierSelect) supplierSelect.value = String(query.supplierId);
    }

    readFiltersFromForm();

    document.getElementById('filter-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      state.page = 1;
      readFiltersFromForm();
      renderTable();
    });

    document.getElementById('btn-clear-filters')?.addEventListener('click', clearFilters);

    const debouncedFilter = debounce(() => {
      state.page = 1;
      readFiltersFromForm();
      renderTable();
    }, 400);

    ['filter-search', 'filter-sku'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', debouncedFilter);
    });

    ShopAdmin.ui.bindTableSort(document.querySelector('.admin-table'), (field, dir) => {
      state.sortField = field;
      state.sortDir = dir;
      renderTable();
    });

    document.getElementById('btn-resync-api')?.addEventListener('click', async () => {
      const result = await ShopAdmin.sync.syncCatalogFromApi({ force: true });
      if (result.ok) {
        ShopAdmin.ui.showToast('success', `${result.products.toLocaleString('fa-IR')} محصول از دیتابیس بارگذاری شد`);
        populateFilterDropdowns();
        renderTable();
      } else {
        ShopAdmin.ui.showToast('error', result.message || 'همگام‌سازی ناموفق بود');
      }
    });

    renderTable();
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.ShopAdmin);
