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

  const mapApiProduct = (dto) => ({
    id: Number(pick(dto, 'id', 'Id')),
    name: pick(dto, 'name', 'Name') || 'محصول',
    categoryId: pick(dto, 'categoryId', 'CategoryId') ?? null,
    categoryName: pick(dto, 'categoryName', 'CategoryName') || '',
    supplierId: pick(dto, 'supplierId', 'SupplierId') ?? null,
    supplierName: pick(dto, 'supplierName', 'SupplierName') || '',
    price: Number(pick(dto, 'price', 'Price')) || 0,
    stock: Number(pick(dto, 'stock', 'Stock')) || 0,
    minimumStock: Number(pick(dto, 'minimumStock', 'MinimumStock')) || 5,
    hasOrders: pick(dto, 'hasOrders', 'HasOrders') === true,
    isActive: pick(dto, 'isActive', 'IsActive') !== false,
    description: pick(dto, 'description', 'Description') || '',
    slug: pick(dto, 'slug', 'Slug') || '',
    imageUrl: pick(dto, 'imageUrl', 'ImageUrl') || '',
    thumbnailUrl: pick(dto, 'thumbnailUrl', 'ThumbnailUrl') || pick(dto, 'imageUrl', 'ImageUrl') || '',
    rating: 0,
    reviewCount: 0,
    createdAt: pick(dto, 'createdAt', 'CreatedAt') || new Date().toISOString(),
    source: 'api',
    seo: {
      metaTitle: pick(dto, 'metaTitle', 'MetaTitle') || '',
      metaDescription: pick(dto, 'metaDescription', 'MetaDescription') || '',
      keywords: pick(dto, 'metaKeywords', 'MetaKeywords') || '',
      canonicalUrl: pick(dto, 'canonicalUrl', 'CanonicalUrl') || '',
      ogTitle: pick(dto, 'ogTitle', 'OgTitle') || '',
      ogDescription: pick(dto, 'ogDescription', 'OgDescription') || ''
    }
  });

  const categoryRepo = ShopAdmin.storage.createRepository('categories');
  const supplierRepo = ShopAdmin.storage.createRepository('suppliers');

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

  const toApiPayload = (product) => ({
    name: product.name,
    description: product.description || null,
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    isActive: product.isActive !== false,
    minimumStock: Number(product.minimumStock) || 0,
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
    let list = [...products];

    if (f.search) {
      const q = f.search.toLowerCase();
      list = list.filter((p) => (p.name || '').toLowerCase().includes(q));
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

  const getThumbUrl = (product) => {
    const remote = product.thumbnailUrl || product.imageUrl;
    if (remote && ShopAdmin.api?.mediaUrl) {
      return ShopAdmin.api.mediaUrl(remote);
    }
    return null;
  };

  const findProduct = (id) => apiProducts.find((p) => Number(p.id) === Number(id));

  const getOrderUsageBadge = (hasOrders) => (
    hasOrders
      ? '<span class="badge bg-info-subtle text-info-emphasis border border-info-subtle">بله</span>'
      : '<span class="badge bg-light text-muted border">خیر</span>'
  );

  const renderTable = async () => {
    const tbody = document.getElementById('products-tbody');
    const container = document.getElementById('table-container');
    if (!tbody) return;

    ShopAdmin.ui.showLoading(container);

    const categories = getCategoryMap();
    const suppliers = getSupplierMap();
    let products = applyFilters(apiProducts);
    products = sortItems(products, state.sortField, state.sortDir);

    const pageSize = state.pageSize || 10;
    const result = paginate(products, state.page, pageSize);

    document.getElementById('results-count').textContent =
      `${result.totalItems.toLocaleString('fa-IR')} محصول`;
    document.getElementById('pagination-info').textContent =
      `صفحه ${result.page.toLocaleString('fa-IR')} از ${result.totalPages.toLocaleString('fa-IR')}`;

    const placeholder = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="#e2e8f0" width="40" height="40"/><text x="50%" y="55%" text-anchor="middle" fill="#94a3b8" font-size="10">—</text></svg>');

    if (result.items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" class="text-center py-5 text-muted">
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
        <td class="col-img"><img class="table-img" alt="${escapeHtml(p.name || '')}" src="${escapeHtml(getThumbUrl(p) || placeholder)}" width="40" height="40" loading="lazy"></td>
        <td class="col-id">${p.id.toLocaleString('fa-IR')}</td>
        <td class="col-name"><span class="product-name-cell" title="${escapeHtml(p.name || '')}">${escapeHtml(p.name)}</span></td>
        <td class="col-cat">${escapeHtml(p.categoryName || categories.get(p.categoryId) || '—')}</td>
        <td class="col-supplier">${escapeHtml(p.supplierName || suppliers.get(p.supplierId) || '—')}</td>
        <td class="col-price">${escapeHtml(formatPrice(p.price))}</td>
        <td class="col-stock">${(Number(p.stock) || 0).toLocaleString('fa-IR')}</td>
        <td class="col-order-usage">${getOrderUsageBadge(p.hasOrders)}</td>
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

    ShopAdmin.ui.renderPagination(document.getElementById('pagination'), result.page, result.totalPages, (page) => {
      state.page = page;
      renderTable();
    });

    ShopAdmin.ui.hideLoading(container);
  };

  const toggleActive = async (id) => {
    const product = findProduct(id);
    if (!product) return;

    const nextActive = product.isActive === false;
    try {
      await ShopAdmin.api.ensureApiAuth();
      await ShopAdmin.api.updateProduct(id, toApiPayload({ ...product, isActive: nextActive }));
      product.isActive = nextActive;
      ShopAdmin.ui.showToast('success', nextActive ? 'محصول فعال شد.' : 'محصول غیرفعال شد.');
      renderTable();
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err));
    }
  };

  const deleteProduct = (id) => {
    const product = findProduct(id);
    if (!product) {
      ShopAdmin.ui.showToast('error', 'محصول یافت نشد.');
      return;
    }

    ShopAdmin.ui.showConfirmModal(
      'حذف محصول',
      `آیا از حذف «${product.name}» مطمئن هستید؟`,
      async () => {
        try {
          await ShopAdmin.api.ensureApiAuth();
          await ShopAdmin.api.deleteProduct(Number(id));
          apiProducts = apiProducts.filter((p) => Number(p.id) !== Number(id));
          ShopAdmin.ui.showToast('success', 'محصول حذف شد.');
          renderTable();
        } catch (err) {
          ShopAdmin.ui.showToast('error', apiError(err));
        }
      }
    );
  };

  const buildSearchParams = () => {
    const f = state.filters;
    const params = {
      page: 1,
      pageSize: 50,
      sortBy: state.sortField === 'createdAt' ? 'name' : state.sortField,
      sortDir: state.sortDir
    };
    if (f.search) params.search = f.search;
    if (f.categoryId) params.categoryId = Number(f.categoryId);
    if (f.supplierId) params.supplierId = Number(f.supplierId);
    if (f.priceMin !== '' && f.priceMin != null) params.minPrice = Number(f.priceMin);
    if (f.priceMax !== '' && f.priceMax != null) params.maxPrice = Number(f.priceMax);
    if (f.activeStatus === 'active') params.isActive = true;
    else if (f.activeStatus === 'inactive') params.isActive = false;
    return params;
  };

  const fetchProductsFromApi = async () => {
    const baseParams = buildSearchParams();
    let page = 1;
    let all = [];
    let total = Infinity;

    while (all.length < total && page <= 20) {
      const data = await ShopAdmin.api.getProducts({ ...baseParams, page });
      const items = data?.items || data?.Items || [];
      const search = data?.searchModel || data?.SearchModel || {};
      total = Number(search.recordCount ?? search.RecordCount ?? items.length) || items.length;
      all = all.concat(items.map(mapApiProduct));
      if (!items.length || items.length < baseParams.pageSize) break;
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
    reloadProducts();
  };

  const reloadProducts = async () => {
    const container = document.getElementById('table-container');
    ShopAdmin.ui.showLoading(container);
    try {
      await ShopAdmin.api.ensureApiAuth();
      apiProducts = await fetchProductsFromApi();
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err));
    } finally {
      ShopAdmin.ui.hideLoading(container);
      renderTable();
    }
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
      reloadProducts();
    });

    document.getElementById('btn-clear-filters')?.addEventListener('click', clearFilters);

    const debouncedFilter = debounce(() => {
      state.page = 1;
      readFiltersFromForm();
      reloadProducts();
    }, 400);

    ['filter-search'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', debouncedFilter);
    });

    ShopAdmin.ui.bindTableSort(document.querySelector('.admin-table'), (field, dir) => {
      state.sortField = field;
      state.sortDir = dir;
      renderTable();
    });

    document.getElementById('products-tbody')?.addEventListener('click', (e) => {
      const row = e.target.closest('tr[data-id]');
      if (!row) return;
      const id = Number(row.dataset.id);
      if (!id) return;

      if (e.target.closest('.btn-delete')) {
        e.preventDefault();
        deleteProduct(id);
        return;
      }
      if (e.target.closest('.btn-toggle-active')) {
        e.preventDefault();
        toggleActive(id);
      }
    });

    renderTable();
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.ShopAdmin = window.ShopAdmin || {});
