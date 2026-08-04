(function (ShopSupplier) {
  'use strict';

  const { escapeHtml, formatPrice } = ShopSupplier.utils;

  const stockBadge = (p) => {
    if (!p.stock || p.stock <= 0) return '<span class="badge badge-stock-out">ناموجود</span>';
    if (p.stock <= (p.lowStockThreshold || 5)) return '<span class="badge badge-stock-low">کم‌موجود</span>';
    return '<span class="badge badge-stock-available">موجود</span>';
  };

  const renderTable = () => {
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

    const tbody = document.getElementById('products-body');
    const empty = document.getElementById('products-empty');
    if (!tbody) return;

    if (!products.length) {
      tbody.innerHTML = '';
      empty?.classList.remove('d-none');
      return;
    }
    empty?.classList.add('d-none');

    tbody.innerHTML = products.map((p) => `
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
        <td class="text-nowrap">
          <a href="product-form.html?id=${encodeURIComponent(p.id)}" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-pencil"></i>
          </a>
          <button type="button" class="btn btn-sm btn-outline-danger" data-delete="${escapeHtml(p.id)}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
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
      { label: 'خانه', href: 'index.html' },
      { label: 'محصولات من' }
    ]);

    fillBrandFilter();
    renderTable();

    document.getElementById('filter-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      renderTable();
    });
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      document.getElementById('search').value = '';
      document.getElementById('filter-brand').value = '';
      document.getElementById('filter-status').value = '';
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
        if (confirm('این محصول حذف شود؟')) {
          ShopSupplier.storage.deleteProduct(id);
          ShopSupplier.ui.showToast('success', 'محصول حذف شد.');
          renderTable();
        }
      }
    });
  });
})(window.ShopSupplier = window.ShopSupplier || {});
