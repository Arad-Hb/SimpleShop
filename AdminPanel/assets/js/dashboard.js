/**
 * dashboard.js — صفحه داشبورد پنل مدیریت
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml, formatPrice, formatDateTime, getStatusBadge } = ShopAdmin.utils;
  const { getProductStockStatus } = ShopAdmin.storage;

  const PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  const ORDER_STATUS_COLORS = {
    pending: '#d97706',
    processing: '#0284c7',
    shipped: '#4f46e5',
    delivered: '#059669',
    cancelled: '#dc2626'
  };

  const isToday = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear()
      && d.getMonth() === now.getMonth()
      && d.getDate() === now.getDate();
  };

  const computeStats = (data) => {
    const { products, categories, suppliers, customers, orders, reviews } = data;

    const activeProducts = products.filter((p) => p.isActive !== false);
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      const status = getProductStockStatus(p);
      if (status === 'low') lowStock += 1;
      if (status === 'out') outOfStock += 1;
    });

    const deliveredPaid = orders.filter(
      (o) => o.status === 'delivered' && o.paymentStatus === 'paid'
    );
    const totalSales = deliveredPaid.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const todayOrders = orders.filter((o) => isToday(o.createdAt)).length;
    const pendingReviews = reviews.filter((r) => r.status === 'pending').length;

    return {
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      categories: categories.length,
      suppliers: suppliers.length,
      customers: customers.length,
      orders: orders.length,
      todayOrders,
      totalSales,
      pendingReviews,
      lowStock,
      outOfStock
    };
  };

  const renderStats = (stats) => {
    const setStat = (key, value, formatter) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (el) el.textContent = formatter ? formatter(value) : value.toLocaleString('fa-IR');
    };

    setStat('totalProducts', stats.totalProducts);
    setStat('activeProducts', stats.activeProducts);
    setStat('categories', stats.categories);
    setStat('suppliers', stats.suppliers);
    setStat('customers', stats.customers);
    setStat('orders', stats.orders);
    setStat('todayOrders', stats.todayOrders);
    setStat('totalSales', stats.totalSales, (v) => formatPrice(v));
    setStat('pendingReviews', stats.pendingReviews);
    setStat('lowStock', stats.lowStock);
    setStat('outOfStock', stats.outOfStock);
  };

  const getCustomerName = (customers, customerId) => {
    const c = customers.find((x) => x.id === customerId);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };

  const getProductName = (products, productId) => {
    const p = products.find((x) => x.id === productId);
    return p ? p.name : '—';
  };

  const renderRecentOrders = (data) => {
    const tbody = document.getElementById('recent-orders-body');
    if (!tbody) return;

    const recent = [...data.orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    if (!recent.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">سفارشی ثبت نشده است.</td></tr>';
      return;
    }

    tbody.innerHTML = recent.map((order) => `
      <tr>
        <td><a href="orders.html">${escapeHtml(order.orderNumber)}</a></td>
        <td>${escapeHtml(getCustomerName(data.customers, order.customerId))}</td>
        <td>${escapeHtml(formatPrice(order.total))}</td>
        <td>${getStatusBadge(order.status)}</td>
        <td class="text-muted small">${escapeHtml(formatDateTime(order.createdAt))}</td>
      </tr>
    `).join('');
  };

  const renderLowStock = (data) => {
    const tbody = document.getElementById('low-stock-body');
    if (!tbody) return;

    const lowItems = data.products
      .filter((p) => {
        const status = getProductStockStatus(p);
        return status === 'low' || status === 'out';
      })
      .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0))
      .slice(0, 5);

    if (!lowItems.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">محصولی با موجودی کم وجود ندارد.</td></tr>';
      return;
    }

    tbody.innerHTML = lowItems.map((product) => {
      const status = getProductStockStatus(product);
      const badgeClass = status === 'out' ? 'badge-stock-out' : 'badge-stock-low';
      const badgeLabel = status === 'out' ? 'ناموجود' : 'کم موجود';
      return `
        <tr>
          <td><a href="products.html">${escapeHtml(product.name)}</a></td>
          <td>${(Number(product.stock) || 0).toLocaleString('fa-IR')}</td>
          <td>${(Number(product.minimumStock) ?? 5).toLocaleString('fa-IR')}</td>
          <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
        </tr>
      `;
    }).join('');
  };

  const renderPendingReviews = (data) => {
    const tbody = document.getElementById('pending-reviews-body');
    if (!tbody) return;

    const pending = data.reviews
      .filter((r) => r.status === 'pending')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    if (!pending.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">نظر در انتظاری وجود ندارد.</td></tr>';
      return;
    }

    tbody.innerHTML = pending.map((review) => `
      <tr>
        <td><a href="reviews.html">${escapeHtml(getProductName(data.products, review.productId))}</a></td>
        <td>${escapeHtml(getCustomerName(data.customers, review.customerId))}</td>
        <td>
          <span class="text-warning">
            ${'★'.repeat(review.rating || 0)}${'☆'.repeat(5 - (review.rating || 0))}
          </span>
        </td>
        <td>${escapeHtml(review.title || '—')}</td>
        <td class="text-muted small">${escapeHtml(formatDateTime(review.createdAt))}</td>
      </tr>
    `).join('');
  };

  const getMonthlySales = (orders) => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: PERSIAN_MONTHS[d.getMonth()] || d.toLocaleDateString('fa-IR', { month: 'short' }),
        total: 0
      });
    }

    orders
      .filter((o) => o.status === 'delivered' && o.paymentStatus === 'paid')
      .forEach((order) => {
        const d = new Date(order.createdAt);
        const bucket = months.find(
          (m) => m.year === d.getFullYear() && m.month === d.getMonth()
        );
        if (bucket) bucket.total += Number(order.total) || 0;
      });

    return months;
  };

  const renderMonthlySalesChart = (orders) => {
    const container = document.getElementById('monthly-sales-chart');
    if (!container) return;

    const months = getMonthlySales(orders);
    const maxTotal = Math.max(...months.map((m) => m.total), 1);

    container.innerHTML = months.map((m) => {
      const heightPct = Math.round((m.total / maxTotal) * 100);
      const height = Math.max(heightPct, m.total > 0 ? 8 : 4);
      const title = `${m.label}: ${formatPrice(m.total)}`;
      return `
        <div class="chart-bar" style="height:${height}%" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">
          <span>${escapeHtml(m.label)}</span>
        </div>
      `;
    }).join('');
  };

  const renderOrderStatusDonut = (orders) => {
    const donutEl = document.getElementById('order-status-donut');
    const legendEl = document.getElementById('order-status-legend');
    if (!donutEl || !legendEl) return;

    const statusCounts = {};
    orders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    const entries = Object.entries(statusCounts);
    const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;

    if (!entries.length) {
      donutEl.innerHTML = '<p class="text-muted text-center mb-0">داده‌ای وجود ندارد</p>';
      legendEl.innerHTML = '';
      return;
    }

    let cumulative = 0;
    const segments = entries.map(([status, count]) => {
      const pct = (count / total) * 100;
      const start = cumulative;
      cumulative += pct;
      return { status, count, pct, start, end: cumulative };
    });

    const conicStops = segments.map((seg) => {
      const color = ORDER_STATUS_COLORS[seg.status] || '#94a3b8';
      return `${color} ${seg.start}% ${seg.end}%`;
    }).join(', ');

    donutEl.innerHTML = `
      <div class="position-relative" style="width:160px;height:160px" role="img" aria-label="نمودار وضعیت سفارش‌ها">
        <div style="width:100%;height:100%;border-radius:50%;background:conic-gradient(${conicStops})"></div>
        <div class="position-absolute top-50 start-50 translate-middle bg-white rounded-circle d-flex flex-column align-items-center justify-content-center"
             style="width:55%;height:55%">
          <strong class="fs-5">${total.toLocaleString('fa-IR')}</strong>
          <small class="text-muted">سفارش</small>
        </div>
      </div>`;

    const statusLabels = ShopAdmin.utils.STATUS_BADGES;
    legendEl.innerHTML = `
      <ul class="list-unstyled mb-0 small">
        ${segments.map((seg) => {
          const label = statusLabels[seg.status]?.label || seg.status;
          const color = ORDER_STATUS_COLORS[seg.status] || '#94a3b8';
          return `
            <li class="d-flex justify-content-between align-items-center mb-2">
              <span>
                <span class="d-inline-block rounded-circle me-2" style="width:10px;height:10px;background:${color}"></span>
                ${escapeHtml(label)}
              </span>
              <span class="text-muted">${seg.count.toLocaleString('fa-IR')} (${Math.round(seg.pct).toLocaleString('fa-IR')}%)</span>
            </li>`;
        }).join('')}
      </ul>`;
  };

  const initDashboard = () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' }
    ]);

    const data = ShopAdmin.storage.getData();
    const stats = computeStats(data);

    renderStats(stats);
    renderRecentOrders(data);
    renderLowStock(data);
    renderPendingReviews(data);
    renderMonthlySalesChart(data.orders);
    renderOrderStatusDonut(data.orders);
  };

  document.addEventListener('DOMContentLoaded', initDashboard);
})(window.ShopAdmin = window.ShopAdmin || {});
