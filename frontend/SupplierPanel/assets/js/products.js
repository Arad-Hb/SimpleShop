(function (ShopSupplier) {
  'use strict';

  const { escapeHtml, formatPrice } = ShopSupplier.utils;
  const PAGE_SIZE = 8;
  let currentPage = 1;

  const stockBadge = (p) => {
    if (!p.stock || p.stock <= 0) return '<span class="badge badge-stock-out">ناموجود</span>';
    if (p.stock <= (p.lowStockThreshold || 5)) return '<span class="badge badge-stock-low">کم‌موجود</span>';
    return '<span class="badge badge-stock-available">موجود</span>';
  };

  const filteredProducts = () => {
    const q = (document.getElementById('search')?.value || '').trim().toLowerCase();
    const brandFilter = document.getElementById('filter-brand')?.value || '';
    const statusFilter = document.getElementById('filter-status')?.value || '';

    let products = ShopSupplier.storage.getProducts();
    if (q) {
      products = products.filter((p) =>
        [p.name, p.sku, p.brandName].join(' ').toLowerCase().includes(q)
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
          <div class="small text-muted">${escapeHtml(p.sku || '')}</div>
        </td>
        <td>${escapeHtml(p.brandName || '—')}</td>
        <td>${formatPrice(p.price)}</td>
        <td>
          <div class="stock-stepper" data-stock-for="${escapeHtml(p.id)}">
            <button type="button" data-delta="-1" aria-label="کاهش موجودی"><i class="bi bi-dash"></i></button>
            <span class="stock-value">${Number(p.stock || 0).toLocaleString('fa-IR')}</span>
            <button type="button" data-delta="1" aria-label="افزایش موجودی"><i class="bi bi-plus"></i></button>
          </div>
        </td>
        <td>${stockBadge(p)}</td>
        <td>
          <span class="badge ${p.isActive !== false ? 'badge-stock-available' : 'badge-stock-inactive'}">
            ${p.isActive !== false ? 'فعال' : 'غیرفعال'}
          </span>
        </td>
        <td class="text-center col-actions">
          <div class="table-actions">
            <a href="product-form.html?id=${encodeURIComponent(p.id)}" class="btn btn-sm btn-outline-primary" title="ویرایش">
              <i class="bi bi-pencil"></i>
            </a>
            <button type="button" class="btn btn-sm btn-outline-danger" data-delete="${escapeHtml(p.id)}" title="حذف">
              <i class="bi bi-trash"></i>
            </button>
          </div>
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
    const brands = ShopSupplier.storage.getBrands();
    select.innerHTML = '<option value="">همه برندها</option>' +
      brands.map((b) => `<option value="${escapeHtml(b.id)}">${escapeHtml(b.name)}</option>`).join('');
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (!ShopSupplier.auth.requireAuth()) return;

    ShopSupplier.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'محصولات من' }
    ]);

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

    document.getElementById('products-body')?.addEventListener('click', (e) => {
      const deltaBtn = e.target.closest('[data-delta]');
      if (deltaBtn) {
        const stepper = deltaBtn.closest('[data-stock-for]');
        const id = stepper?.dataset.stockFor;
        const delta = Number(deltaBtn.dataset.delta);
        if (id && delta) {
          ShopSupplier.storage.adjustStock(id, delta);
          ShopSupplier.ui.showToast('success', 'موجودی به‌روزرسانی شد.');
          renderTable();
        }
        return;
      }

      const delBtn = e.target.closest('[data-delete]');
      if (delBtn) {
        const id = delBtn.dataset.delete;
        ShopSupplier.ui.showConfirmModal(
          'حذف محصول',
          'این محصول حذف شود؟ این کار قابل بازگشت نیست.',
          () => {
            ShopSupplier.storage.deleteProduct(id);
            ShopSupplier.ui.showToast('success', 'محصول حذف شد.');
            renderTable();
          }
        );
      }
    });
  });
})(window.ShopSupplier = window.ShopSupplier || {});
