/**
 * reports.js — گزارش‌ها و تحلیل فروشگاه
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml, formatPrice } = ShopAdmin.utils;

  let rawData = null;
  let filters = {
    dateFrom: '',
    dateTo: '',
    categoryId: '',
    productId: '',
    customerId: '',
    orderStatus: '',
    paymentStatus: ''
  };

  const getFilteredOrders = () => {
    let orders = [...(rawData.orders || [])];
    const orderItems = rawData.orderItems || [];

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      orders = orders.filter((o) => new Date(o.createdAt) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      orders = orders.filter((o) => new Date(o.createdAt) <= to);
    }
    if (filters.customerId) {
      orders = orders.filter((o) => o.customerId === Number(filters.customerId));
    }
    if (filters.orderStatus) {
      orders = orders.filter((o) => o.status === filters.orderStatus);
    }
    if (filters.paymentStatus) {
      orders = orders.filter((o) => o.paymentStatus === filters.paymentStatus);
    }

    if (filters.productId || filters.categoryId) {
      const orderIds = new Set();
      orderItems.forEach((item) => {
        if (filters.productId && item.productId !== Number(filters.productId)) return;
        if (filters.categoryId) {
          const product = rawData.products.find((p) => p.id === item.productId);
          if (!product || product.categoryId !== Number(filters.categoryId)) return;
        }
        orderIds.add(item.orderId);
      });
      orders = orders.filter((o) => orderIds.has(o.id));
    }

    return orders;
  };

  const getFilteredOrderItems = (orders) => {
    const orderIds = new Set(orders.map((o) => o.id));
    let items = (rawData.orderItems || []).filter((i) => orderIds.has(i.orderId));

    if (filters.productId) {
      items = items.filter((i) => i.productId === Number(filters.productId));
    }
    if (filters.categoryId) {
      items = items.filter((i) => {
        const product = rawData.products.find((p) => p.id === i.productId);
        return product && product.categoryId === Number(filters.categoryId);
      });
    }

    return items;
  };

  const getCustomerName = (customerId) => {
    const c = rawData.customers.find((x) => x.id === customerId);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };

  const getProductName = (productId) => {
    const p = rawData.products.find((x) => x.id === productId);
    return p ? p.name : '—';
  };

  const computeReport = () => {
    const orders = getFilteredOrders();
    const orderItems = getFilteredOrderItems(orders);

    const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
    const totalRevenue = paidOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const itemsSold = orderItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const customerIds = new Set(orders.map((o) => o.customerId));

    const approvedReviews = (rawData.reviews || []).filter((r) => r.status === 'approved');
    const avgRating = approvedReviews.length
      ? approvedReviews.reduce((s, r) => s + (r.rating || 0), 0) / approvedReviews.length
      : 0;

    return {
      orders,
      orderItems,
      totalOrders: orders.length,
      totalRevenue,
      avgOrderValue: paidOrders.length ? totalRevenue / paidOrders.length : 0,
      itemsSold,
      activeCustomers: customerIds.size,
      avgRating,
      reviews: rawData.reviews || []
    };
  };

  const renderStats = (report) => {
    const setStat = (key, value) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (!el) return;
      if (key === 'totalRevenue' || key === 'avgOrderValue') {
        el.textContent = formatPrice(value);
      } else if (key === 'avgRating') {
        el.textContent = report.avgRating ? report.avgRating.toFixed(1) : '—';
      } else {
        el.textContent = value.toLocaleString('fa-IR');
      }
    };

    setStat('totalOrders', report.totalOrders);
    setStat('totalRevenue', report.totalRevenue);
    setStat('avgOrderValue', report.avgOrderValue);
    setStat('itemsSold', report.itemsSold);
    setStat('activeCustomers', report.activeCustomers);
    setStat('avgRating', report.avgRating);
  };

  const renderSalesChart = (orders) => {
    const container = document.getElementById('sales-chart');
    if (!container) return;

    const paid = orders.filter((o) => o.paymentStatus === 'paid');
    if (!paid.length) {
      container.innerHTML = '<p class="text-muted text-center w-100">داده‌ای برای نمایش وجود ندارد.</p>';
      return;
    }

    const buckets = {};
    paid.forEach((order) => {
      const d = new Date(order.createdAt);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = (buckets[key] || 0) + (Number(order.total) || 0);
    });

    const sorted = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).slice(-14);
    const maxTotal = Math.max(...sorted.map(([, v]) => v), 1);

    container.innerHTML = sorted.map(([date, total]) => {
      const heightPct = Math.round((total / maxTotal) * 100);
      const height = Math.max(heightPct, 8);
      const label = new Date(date).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
      const title = `${label}: ${formatPrice(total)}`;
      return `
        <div class="chart-bar" style="height:${height}%" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">
          <span>${escapeHtml(label)}</span>
        </div>`;
    }).join('');
  };

  const renderTopProducts = (orderItems) => {
    const tbody = document.getElementById('top-products-body');
    if (!tbody) return;

    const map = {};
    orderItems.forEach((item) => {
      if (!map[item.productId]) {
        map[item.productId] = { qty: 0, revenue: 0, name: item.productName || getProductName(item.productId) };
      }
      map[item.productId].qty += Number(item.quantity) || 0;
      map[item.productId].revenue += Number(item.total) || 0;
    });

    const top = Object.entries(map)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 10);

    if (!top.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">داده‌ای وجود ندارد.</td></tr>';
      return;
    }

    tbody.innerHTML = top.map(([id, data], i) => `
      <tr>
        <td>${(i + 1).toLocaleString('fa-IR')}</td>
        <td>${escapeHtml(data.name)}</td>
        <td>${data.qty.toLocaleString('fa-IR')}</td>
        <td>${escapeHtml(formatPrice(data.revenue))}</td>
      </tr>
    `).join('');
  };

  const renderTopCustomers = (orders) => {
    const tbody = document.getElementById('top-customers-body');
    if (!tbody) return;

    const map = {};
    orders.filter((o) => o.paymentStatus === 'paid').forEach((order) => {
      if (!map[order.customerId]) {
        map[order.customerId] = { count: 0, total: 0 };
      }
      map[order.customerId].count += 1;
      map[order.customerId].total += Number(order.total) || 0;
    });

    const top = Object.entries(map)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10);

    if (!top.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">داده‌ای وجود ندارد.</td></tr>';
      return;
    }

    tbody.innerHTML = top.map(([id, data], i) => `
      <tr>
        <td>${(i + 1).toLocaleString('fa-IR')}</td>
        <td>${escapeHtml(getCustomerName(Number(id)))}</td>
        <td>${data.count.toLocaleString('fa-IR')}</td>
        <td>${escapeHtml(formatPrice(data.total))}</td>
      </tr>
    `).join('');
  };

  const renderReviewStats = (reviews) => {
    const total = reviews.length;
    const approved = reviews.filter((r) => r.status === 'approved').length;
    const pending = reviews.filter((r) => r.status === 'pending').length;
    const rejected = reviews.filter((r) => r.status === 'rejected').length;

    document.getElementById('review-total').textContent = total.toLocaleString('fa-IR');
    document.getElementById('review-approved').textContent = approved.toLocaleString('fa-IR');
    document.getElementById('review-pending').textContent = pending.toLocaleString('fa-IR');
    document.getElementById('review-rejected').textContent = rejected.toLocaleString('fa-IR');

    const distEl = document.getElementById('rating-distribution');
    if (!distEl) return;

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.filter((r) => r.status === 'approved').forEach((r) => {
      const rating = Number(r.rating);
      if (counts[rating] != null) counts[rating] += 1;
    });

    const maxCount = Math.max(...Object.values(counts), 1);
    distEl.innerHTML = [5, 4, 3, 2, 1].map((star) => {
      const count = counts[star];
      const pct = Math.round((count / maxCount) * 100);
      return `
        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="text-warning" style="width:80px">${'★'.repeat(star)}${'☆'.repeat(5 - star)}</span>
          <div class="progress flex-grow-1" style="height:20px">
            <div class="progress-bar bg-warning" style="width:${pct}%" role="progressbar"
                 aria-valuenow="${count}" aria-valuemin="0" aria-valuemax="${maxCount}"></div>
          </div>
          <span class="text-muted small" style="width:40px">${count.toLocaleString('fa-IR')}</span>
        </div>`;
    }).join('');
  };

  const renderAll = () => {
    const report = computeReport();
    renderStats(report);
    renderSalesChart(report.orders);
    renderTopProducts(report.orderItems);
    renderTopCustomers(report.orders);
    renderReviewStats(report.reviews);
  };

  const populateSelects = () => {
    const catSel = document.getElementById('filter-category');
    const prodSel = document.getElementById('filter-product');
    const custSel = document.getElementById('filter-customer');

    if (catSel) {
      catSel.innerHTML = '<option value="">همه</option>'
        + (rawData.categories || []).map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    }
    if (prodSel) {
      prodSel.innerHTML = '<option value="">همه</option>'
        + (rawData.products || []).map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    }
    if (custSel) {
      custSel.innerHTML = '<option value="">همه</option>'
        + (rawData.customers || []).map((c) => `<option value="${c.id}">${escapeHtml(`${c.firstName} ${c.lastName}`)}</option>`).join('');
    }
  };

  const readFilters = () => {
    filters = {
      dateFrom: document.getElementById('filter-date-from')?.value || '',
      dateTo: document.getElementById('filter-date-to')?.value || '',
      categoryId: document.getElementById('filter-category')?.value || '',
      productId: document.getElementById('filter-product')?.value || '',
      customerId: document.getElementById('filter-customer')?.value || '',
      orderStatus: document.getElementById('filter-order-status')?.value || '',
      paymentStatus: document.getElementById('filter-payment-status')?.value || ''
    };
  };

  const exportCsv = () => {
    const report = computeReport();
    const rows = [
      ['گزارش فروشگاه', new Date().toLocaleDateString('fa-IR')],
      [],
      ['آمار کلی'],
      ['کل سفارش‌ها', report.totalOrders],
      ['درآمد کل', report.totalRevenue],
      ['میانگین سفارش', Math.round(report.avgOrderValue)],
      ['اقلام فروخته‌شده', report.itemsSold],
      ['مشتریان فعال', report.activeCustomers],
      ['میانگین امتیاز', report.avgRating.toFixed(1)],
      [],
      ['محصولات پرفروش', 'تعداد', 'درآمد']
    ];

    const productMap = {};
    report.orderItems.forEach((item) => {
      if (!productMap[item.productId]) {
        productMap[item.productId] = { qty: 0, revenue: 0, name: item.productName || getProductName(item.productId) };
      }
      productMap[item.productId].qty += Number(item.quantity) || 0;
      productMap[item.productId].revenue += Number(item.total) || 0;
    });

    Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .forEach((p) => rows.push([p.name, p.qty, p.revenue]));

    rows.push([], ['مشتریان برتر', 'سفارش', 'مجموع خرید']);
    const custMap = {};
    report.orders.filter((o) => o.paymentStatus === 'paid').forEach((o) => {
      if (!custMap[o.customerId]) custMap[o.customerId] = { count: 0, total: 0 };
      custMap[o.customerId].count += 1;
      custMap[o.customerId].total += Number(o.total) || 0;
    });
    Object.entries(custMap)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10)
      .forEach(([id, d]) => rows.push([getCustomerName(Number(id)), d.count, d.total]));

    const csvContent = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shop-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    ShopAdmin.ui.showToast('success', 'فایل CSV دانلود شد.');
  };

  const bindEvents = () => {
    document.getElementById('btn-apply-filters')?.addEventListener('click', () => {
      readFilters();
      renderAll();
    });

    document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
      ['filter-date-from', 'filter-date-to', 'filter-category', 'filter-product',
        'filter-customer', 'filter-order-status', 'filter-payment-status'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      filters = { dateFrom: '', dateTo: '', categoryId: '', productId: '', customerId: '', orderStatus: '', paymentStatus: '' };
      renderAll();
    });

    document.getElementById('btn-export-csv')?.addEventListener('click', exportCsv);
    document.getElementById('btn-print')?.addEventListener('click', () => window.print());
  };

  const initReports = () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'گزارش‌ها' }
    ]);

    rawData = ShopAdmin.storage.getData();
    populateSelects();
    bindEvents();
    renderAll();
  };

  document.addEventListener('DOMContentLoaded', initReports);
})(window.ShopAdmin = window.ShopAdmin || {});
