/**
 * products.js — صفحه فهرست محصولات
 */
(function (ShopAdmin) {
  'use strict';

  if (!ShopAdmin.auth.requireAuth()) return;

  const {
    escapeHtml, formatPrice, formatDateTime, getStockBadge, getStatusBadge, debounce
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

  const loadThumbUrl = async (imageId) => {
    if (!imageId) return null;
    if (thumbCache.has(imageId)) return thumbCache.get(imageId);
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
          <td colspan="14" class="text-center py-5 text-muted">
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
        <td><img class="table-img" data-thumb="${escapeHtml(getPrimaryImageId(p) || '')}" alt="" src="" width="48" height="48"></td>
        <td>${p.id.toLocaleString('fa-IR')}</td>
        <td><code>${escapeHtml(p.sku)}</code></td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(categories.get(p.categoryId) || '—')}</td>
        <td>${escapeHtml(suppliers.get(p.supplierId) || '—')}</td>
        <td>${renderPriceCell(p)}</td>
        <td>${(Number(p.stock) || 0).toLocaleString('fa-IR')}</td>
        <td>${(Number(p.minimumStock) ?? 5).toLocaleString('fa-IR')}</td>
        <td>${getStockBadge(p)}</td>
        <td>${getStatusBadge(p.isActive !== false ? 'active' : 'inactive')}</td>
        <td>${(Number(p.rating) || 0).toLocaleString('fa-IR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
        <td>${(Number(p.reviewCount) || 0).toLocaleString('fa-IR')}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <a href="product-form.html?id=${p.id}" class="btn btn-outline-primary" title="ویرایش" aria-label="ویرایش"><i class="bi bi-pencil"></i></a>
            <button type="button" class="btn btn-outline-secondary btn-toggle-active" title="تغییر وضعیت" aria-label="تغییر وضعیت">
              <i class="bi bi-${p.isActive !== false ? 'pause' : 'play'}-circle"></i>
            </button>
            <button type="button" class="btn btn-outline-danger btn-delete" title="حذف" aria-label="حذف"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    await Promise.all([...tbody.querySelectorAll('[data-thumb]')].map(async (img) => {
      const id = img.dataset.thumb;
      if (!id) {
        img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect fill="#e2e8f0" width="48" height="48"/><text x="50%" y="55%" text-anchor="middle" fill="#94a3b8" font-size="10">—</text></svg>');
        return;
      }
      const url = await loadThumbUrl(id);
      if (url) img.src = url;
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

  const init = () => {
    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'محصولات' }
    ]);

    populateFilterDropdowns();
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
})(window.ShopAdmin);
