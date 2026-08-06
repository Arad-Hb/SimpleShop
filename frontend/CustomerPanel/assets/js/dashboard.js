(function (ShopCustomer) {
  'use strict';

  const { escapeHtml, formatPrice, formatDateTime, fullName } = ShopCustomer.utils;

  const statusLabel = {
    delivered: 'تحویل‌شده',
    shipping: 'در حال ارسال',
    pending: 'در انتظار',
    cancelled: 'لغو‌شده'
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (!ShopCustomer.auth.requireAuth()) return;

    ShopCustomer.ui.initBreadcrumb([{ label: 'داشبورد' }]);

    const profile = ShopCustomer.storage.getProfile();
    const stats = ShopCustomer.storage.stats();
    const orders = ShopCustomer.storage.getOrders()
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const greet = document.getElementById('dash-greet');
    if (greet) greet.textContent = fullName(profile);

    const map = {
      'stat-orders': stats.orderCount,
      'stat-paid': stats.paidCount,
      'stat-pending': stats.pendingCount,
      'stat-spent': formatPrice(stats.totalSpent),
      'stat-carts': stats.openCarts,
      'stat-cart-items': stats.openCartItems
    };
    Object.entries(map).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = typeof value === 'number' ? value.toLocaleString('fa-IR') : value;
    });

    const body = document.getElementById('recent-orders');
    if (!body) return;

    const recent = orders.slice(0, 5);
    if (!recent.length) {
      body.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">هنوز سفارشی ثبت نشده است.</td></tr>`;
      return;
    }

    body.innerHTML = recent.map((o) => `
      <tr>
        <td><strong>${escapeHtml(o.orderNumber)}</strong></td>
        <td><span class="order-status order-status--${escapeHtml(o.status)}">${escapeHtml(statusLabel[o.status] || o.status)}</span></td>
        <td>${formatPrice(o.total)}</td>
        <td>${formatDateTime(o.createdAt)}</td>
        <td class="text-center">
          <a class="btn btn-sm btn-outline-primary" href="orders.html?id=${encodeURIComponent(o.id)}">جزئیات</a>
        </td>
      </tr>
    `).join('');
  });
})(window.ShopCustomer = window.ShopCustomer || {});
