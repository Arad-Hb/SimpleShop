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

  const { parseError } = window.SimpleShopHttp || {};
  const apiError = (err) => (parseError ? parseError(err) : (err?.message || 'خطا در ارتباط با سرور.'));

  const pick = (dto, camel, pascal) => dto?.[camel] ?? dto?.[pascal];

  const mapApiProduct = (dto) => {
    const gallery = Array.isArray(dto.gallery) ? dto.gallery : (Array.isArray(dto.Gallery) ? dto.Gallery : []);
    const imageUrl = pick(dto, 'imageUrl', 'ImageUrl') || '';
    const thumbnailUrl = pick(dto, 'thumbnailUrl', 'ThumbnailUrl') || imageUrl || '';
    const images = gallery.length
      ? gallery.map((g, i) => ({
          id: `api-img-${pick(dto, 'id', 'Id')}-${pick(g, 'id', 'Id') || i}`,
          alt: pick(g, 'altText', 'AltText') || pick(dto, 'name', 'Name') || '',
          isPrimary: pick(g, 'isPrimary', 'IsPrimary') === true || i === 0,
          sortOrder: pick(g, 'sortOrder', 'SortOrder') ?? i,
          url: pick(g, 'url', 'Url') || imageUrl,
          thumbnailUrl: pick(g, 'thumbnailUrl', 'ThumbnailUrl') || thumbnailUrl
        }))
      : (imageUrl || thumbnailUrl
        ? [{
            id: `api-img-${pick(dto, 'id', 'Id')}-primary`,
            alt: pick(dto, 'name', 'Name') || '',
            isPrimary: true,
            sortOrder: 0,
            url: imageUrl,
            thumbnailUrl
          }]
        : []);

    return {
      id: pick(dto, 'id', 'Id'),
      name: pick(dto, 'name', 'Name') || 'محصول',
      sku: pick(dto, 'sku', 'Sku') || `API-${String(pick(dto, 'id', 'Id')).padStart(4, '0')}`,
      categoryId: pick(dto, 'categoryId', 'CategoryId') ?? null,
      categoryName: pick(dto, 'categoryName', 'CategoryName') || '',
      supplierId: pick(dto, 'supplierId', 'SupplierId') ?? null,
      supplierName: pick(dto, 'supplierName', 'SupplierName') || '',
      price: Number(pick(dto, 'price', 'Price')) || 0,
      discountPrice: null,
      stock: Number(pick(dto, 'stock', 'Stock')) || 0,
      minimumStock: 5,
      isActive: pick(dto, 'isActive', 'IsActive') !== false,
      description: pick(dto, 'description', 'Description') || '',
      imageId: images[0]?.id || null,
      imageUrl,
      thumbnailUrl,
      images,
      rating: 0,
      reviewCount: 0,
      createdAt: pick(dto, 'createdAt', 'CreatedAt') || new Date().toISOString(),
      source: 'api'
    };
  };

  const categoryRepo = ShopAdmin.storage.createRepository('categories');
  const supplierRepo = ShopAdmin.storage.createRepository('suppliers');
  const { imageStore } = ShopAdmin.storage;

  const thumbCache = new Map();
  let apiProducts = [];
  let categoriesLoaded = [];
  let suppliersLoaded = [];

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

    const product = apiProducts.find((p) =>
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
    (categoriesLoaded.length ? categoriesLoaded : categoryRepo.getAll())
      .forEach((c) => map.set(c.id, c.name));
    return map;
  };

  const getSupplierMap = () => {
    const map = new Map();
    (suppliersLoaded.length ? suppliersLoaded : supplierRepo.getAll())
      .forEach((s) => map.set(s.id, s.name));
    return map;
  };

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

    const categories = categoriesLoaded.length ? categoriesLoaded : categoryRepo.getAll();
    const suppliers = suppliersLoaded.length ? suppliersLoaded : supplierRepo.getAll();

    categories
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name}${c.isActive === false ? ' (غیرفعال)' : ''}`;
        catSel.appendChild(opt);
      });

    suppliers.forEach((s) => {
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
    let products = applyFilters(apiProducts.map(normalizeProduct));
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

  const toApiPayload = (product) => ({
    name: product.name,
    description: product.description || null,
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    categoryId: Number(product.categoryId),
    supplierId: product.supplierId ? Number(product.supplierId) : null,
    slug: product.slug || null,
    metaTitle: product.seo?.metaTitle || null,
    metaDescription: product.seo?.metaDescription || null,
    metaKeywords: product.seo?.keywords || null,
    canonicalUrl: product.seo?.canonicalUrl || null,
    ogTitle: product.seo?.ogTitle || null,
    ogDescription: product.seo?.ogDescription || null
  });

  const toggleActive = async (id) => {
    const product = apiProducts.find((p) => p.id === id);
    if (!product) return;
    product.isActive = product.isActive === false;
    ShopAdmin.ui.showToast('info', product.isActive ? 'محصول در UI فعال شد.' : 'محصول در UI غیرفعال شد. (API فعلاً isActive را پشتیبانی نمی‌کند)');
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
    const product = apiProducts.find((p) => p.id === id);
    if (!product) return;

    ShopAdmin.ui.showConfirmModal(
      'حذف محصول',
      `آیا از حذف «${product.name}» مطمئن هستید؟`,
      async () => {
        try {
          await ShopAdmin.api.ensureApiAuth();
          await ShopAdmin.api.deleteProduct(id);
          await deleteProductImages(product);
          apiProducts = apiProducts.filter((p) => p.id !== id);
          ShopAdmin.ui.showToast('success', 'محصول حذف شد.');
          renderTable();
        } catch (err) {
          ShopAdmin.ui.showToast('error', apiError(err));
        }
      }
    );
  };

  const fetchProductsFromApi = async () => {
    const pageSize = 50;
    let page = 1;
    let all = [];
    let total = Infinity;

    while (all.length < total && page <= 20) {
      const data = await ShopAdmin.api.getProducts({ page, pageSize, sortBy: 'name', sortDir: 'asc' });
      const items = data?.items || data?.Items || [];
      const search = data?.searchModel || data?.SearchModel || {};
      total = Number(search.recordCount ?? search.RecordCount ?? items.length) || items.length;
      all = all.concat(items.map(mapApiProduct));
      if (!items.length || items.length < pageSize) break;
      page += 1;
    }

    return all;
  };

  const loadCatalogMeta = async () => {
    try {
      const [cats, supPage] = await Promise.all([
        ShopAdmin.api.getCategories(),
        ShopAdmin.api.getSuppliers()
      ]);
      categoriesLoaded = (Array.isArray(cats) ? cats : []).map((c) => ({
        id: pick(c, 'id', 'Id'),
        name: pick(c, 'name', 'Name') || '',
        sortOrder: pick(c, 'sortOrder', 'SortOrder') ?? 0,
        isActive: pick(c, 'isActive', 'IsActive') !== false
      }));
      suppliersLoaded = (supPage?.items || supPage?.Items || []).map((s) => ({
        id: pick(s, 'id', 'Id'),
        name: pick(s, 'name', 'Name') || '',
        isActive: pick(s, 'isActive', 'IsActive') !== false
      }));
    } catch {
      categoriesLoaded = [];
      suppliersLoaded = [];
    }
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

    try {
      await ShopAdmin.api.ensureApiAuth();
      await loadCatalogMeta();
      apiProducts = await fetchProductsFromApi();
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err));
      apiProducts = [];
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

    renderTable();
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.ShopAdmin = window.ShopAdmin || {});
