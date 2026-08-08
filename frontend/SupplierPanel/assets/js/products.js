(function (ShopSupplier) {
  'use strict';

  const { escapeHtml, formatPrice } = ShopSupplier.utils;
  const PAGE_SIZE = 8;
  let currentPage = 1;
  let apiProducts = [];

  const stockBadge = (p) => {
    if (!p.stock || p.stock <= 0) return '<span class="badge badge-stock-out">ناموجود</span>';
    if (p.stock <= (p.lowStockThreshold || 5)) return '<span class="badge badge-stock-low">کم‌موجود</span>';
    return '<span class="badge badge-stock-available">موجود</span>';
  };

  const filteredProducts = () => {
    const q = (document.getElementById('search')?.value || '').trim().toLowerCase();
    const brandFilter = document.getElementById('filter-brand')?.value || '';
    const statusFilter = document.getElementById('filter-status')?.value || '';

    let products = apiProducts.slice();
    if (q) {
      products = products.filter((p) =>
        [p.name, p.categoryId, p.brandName].join(' ').toLowerCase().includes(q)
      );
    }
    if (brandFilter) products = products.filter((p) => p.brandId === brandFilter);
    if (statusFilter === 'active') products = products.filter((p) => p.isActive !== false);
    if (statusFilter === 'inactive') products = products.filter((p) => p.isActive === false);
    if (statusFilter === 'low') {
      products = products.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5));
    }
    if (statusFilter === 'out') products = products.filter((p) => !p.stock || p.stock <= 0);
    return products;
  };

  const renderTable = () => {
    const products = filteredProducts();
    const tbody = document.getElementById('products-body');
    const empty = document.getElementById('products-empty');
    const infoEl = document.getElementById('pagination-info');
    const paginationEl = document.getElementById('pagination');
    if (!tbody) return;

    if (!products.length) {
      tbody.innerHTML = '';
      empty?.classList.remove('d-none');
      if (infoEl) infoEl.textContent = '';
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }
    empty?.classList.add('d-none');

    const result = ShopSupplier.ui.paginate(products, currentPage, PAGE_SIZE);
    currentPage = result.page;

    tbody.innerHTML = result.items.map((p) => `
      <tr data-id="${escapeHtml(p.id)}">
        <td>
          <div class="fw-semibold">${escapeHtml(p.name)}</div>
          <div class="small text-muted">${p.categoryId != null ? `[${p.categoryId}]` : ''}</div>
        </td>
        <td>${escapeHtml(p.brandName || '—')}</td>
        <td>${formatPrice(p.price)}</td>
        <td>${Number(p.stock || 0).toLocaleString('fa-IR')}</td>
        <td>${stockBadge(p)}</td>
        <td>
          <span class="badge ${p.isActive !== false ? 'badge-stock-available' : 'badge-stock-inactive'}">
            ${p.isActive !== false ? 'فعال' : 'غیرفعال'}
          </span>
        </td>
        <td class="text-center col-actions">
          <span class="text-muted small">فقط مشاهده</span>
        </td>
      </tr>
    `).join('');

    if (infoEl) {
      const from = result.totalItems ? (result.page - 1) * result.pageSize + 1 : 0;
      const to = Math.min(result.page * result.pageSize, result.totalItems);
      infoEl.textContent = `نمایش ${from.toLocaleString('fa-IR')} تا ${to.toLocaleString('fa-IR')} از ${result.totalItems.toLocaleString('fa-IR')} مورد`;
    }

    ShopSupplier.ui.renderPagination(paginationEl, result.page, result.totalPages, (page) => {
      currentPage = page;
      renderTable();
    });
  };

  const fillBrandFilter = () => {
    const select = document.getElementById('filter-brand');
    if (!select) return;
    const brands = new Map();
    apiProducts.forEach((p) => {
      if (p.brandId && !brands.has(p.brandId)) brands.set(p.brandId, p.brandName || p.brandId);
    });
    select.innerHTML = '<option value="">همه برندها</option>' +
      [...brands.entries()].map(([id, name]) =>
        `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`
      ).join('');
  };

  document.addEventListener('DOMContentLoaded', async () => {
    if (!ShopSupplier.auth.requireAuth()) return;

    ShopSupplier.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'محصولات من' }
    ]);

    const tbody = document.getElementById('products-body');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">
        <span class="spinner-border spinner-border-sm me-2"></span>در حال بارگذاری از API...
      </td></tr>`;
    }

    const syncResult = await ShopSupplier.sync.syncProductsFromApi();
    apiProducts = ShopSupplier.sync.getProducts();

    if (!syncResult.ok || !apiProducts.length) {
      const stored = ShopSupplier.storage.getProducts();
      if (stored.length) {
        apiProducts = stored;
        if (!syncResult.ok) {
          ShopSupplier.ui.showToast('info', 'API در دسترس نیست — نمایش محصولات آفلاین.');
        }
      } else if (!syncResult.ok) {
        ShopSupplier.ui.showToast('warning', syncResult.message || 'همگام‌سازی API ناموفق بود.');
      }
    } else if (!syncResult.ok) {
      ShopSupplier.ui.showToast('warning', syncResult.message || 'همگام‌سازی API ناموفق بود.');
    }

    fillBrandFilter();
    ShopSupplier.ui.enhanceFormSelects(document);
    renderTable();

    document.getElementById('filter-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      currentPage = 1;
      renderTable();
    });
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      document.getElementById('search').value = '';
      document.getElementById('filter-brand').value = '';
      document.getElementById('filter-status').value = '';
      document.getElementById('filter-brand')?.dispatchEvent(new Event('change', { bubbles: true }));
      document.getElementById('filter-status')?.dispatchEvent(new Event('change', { bubbles: true }));
      currentPage = 1;
      renderTable();
    });
  });
})(window.ShopSupplier = window.ShopSupplier || {});
