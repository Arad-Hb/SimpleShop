(function (ShopSupplier) {
  'use strict';

  const { escapeHtml, formatPrice, formatDate } = ShopSupplier.utils;

  document.addEventListener('DOMContentLoaded', () => {
    if (!ShopSupplier.auth.requireAuth()) return;

    ShopSupplier.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' }
    ]);

    const s = ShopSupplier.storage.stats();
    const map = {
      productCount: s.productCount,
      activeCount: s.activeCount,
      brandCount: s.brandCount,
      totalStock: s.totalStock,
      lowStock: s.lowStock,
      outOfStock: s.outOfStock
    };
    Object.entries(map).forEach(([key, val]) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (el) el.textContent = Number(val).toLocaleString('fa-IR');
    });

    const products = ShopSupplier.storage.getProducts()
      .slice()
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      .slice(0, 5);

    const tbody = document.getElementById('recent-products');
    if (!tbody) return;

    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">هنوز محصولی ثبت نشده است.</td></tr>';
      return;
    }

    tbody.innerHTML = products.map((p) => {
      let stockClass = 'badge-stock-available';
      let stockLabel = 'موجود';
      if (!p.stock || p.stock <= 0) {
        stockClass = 'badge-stock-out';
        stockLabel = 'ناموجود';
      } else if (p.stock <= (p.lowStockThreshold || 5)) {
        stockClass = 'badge-stock-low';
        stockLabel = 'کم‌موجود';
      }
      return `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.brandName || '—')}</td>
          <td>${formatPrice(p.price)}</td>
          <td><span class="badge ${stockClass}">${stockLabel} (${Number(p.stock).toLocaleString('fa-IR')})</span></td>
          <td>${formatDate(p.updatedAt)}</td>
        </tr>`;
    }).join('');
  });
})(window.ShopSupplier = window.ShopSupplier || {});
