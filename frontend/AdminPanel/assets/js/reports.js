/**
 * reports.js — گزارش‌های فروشگاه
 * UI شمسی؛ فیلترها روی داده میلادی؛ ترجیحاً از API بارگذاری می‌شود.
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml, formatPrice, formatDate, getStatusBadge, debounce } = ShopAdmin.utils;
  const { parseError } = window.SimpleShopHttp || {};
  const apiError = (err) => (parseError ? parseError(err) : (err?.message || 'خطا در ارتباط با سرور.'));

  let rawData = {
    orders: [],
    orderItems: [],
    products: [],
    categories: [],
    customers: [],
    reviews: []
  };

  let filters = {
    reportType: 'overview',
    monthKey: '',
    dateFrom: '',
    dateTo: '',
    categoryId: '',
    productId: '',
    customerQuery: '',
    orderStatus: '',
    paymentStatus: ''
  };

  const STATUS_LABELS = {
    pending: 'در انتظار',
    processing: 'در حال پردازش',
    shipped: 'ارسال شده',
    delivered: 'تحویل شده',
    cancelled: 'لغو شده'
  };

  const PAYMENT_LABELS = {
    paid: 'پرداخت شده',
    unpaid: 'پرداخت نشده',
    refunded: 'مرجوعی'
  };

  const PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  const toFaDigits = (value) => String(value).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

  const normalizeDigits = (value) => String(value || '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

  const normalizeText = (value) => normalizeDigits(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  const normalizeStatus = (status) => String(status || 'pending').trim().toLowerCase();

  const derivePaymentStatus = (status, existing) => {
    if (existing) return String(existing).toLowerCase();
    const s = normalizeStatus(status);
    if (s === 'cancelled') return 'refunded';
    if (s === 'pending') return 'unpaid';
    return 'paid';
  };

  const toJalaliParts = (dateInput) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) return null;
    const gy = date.getFullYear();
    const gm = date.getMonth() + 1;
    const gd = date.getDate();
    if (window.PersianDatePicker?.toJalali) {
      return window.PersianDatePicker.toJalali(gy, gm, gd);
    }
    return null;
  };

  const monthKeyOf = (iso) => {
    const j = toJalaliParts(iso);
    if (!j) {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    return `${j.jy}-${String(j.jm).padStart(2, '0')}`;
  };

  const labelForMonthKey = (key) => {
    if (!key) return 'همه ماه‌ها';
    const [y, m] = String(key).split('-').map(Number);
    if (!y || !m || m < 1 || m > 12) return key;
    return `${PERSIAN_MONTHS[m - 1]} ${toFaDigits(y)}`;
  };

  const monthRange = (key) => {
    if (!key || !/^\d{4}-\d{2}$/.test(key)) return null;
    const [y, m] = key.split('-').map(Number);

    if (window.PersianDatePicker?.toGregorian && y >= 1300 && y <= 1600) {
      const fromG = window.PersianDatePicker.toGregorian(y, m, 1);
      const nextM = m === 12 ? 1 : m + 1;
      const nextY = m === 12 ? y + 1 : y;
      const nextFirst = window.PersianDatePicker.toGregorian(nextY, nextM, 1);
      const to = new Date(nextFirst.gy, nextFirst.gm - 1, nextFirst.gd, 0, 0, 0, 0);
      to.setMilliseconds(-1);
      const from = new Date(fromG.gy, fromG.gm - 1, fromG.gd, 0, 0, 0, 0);
      return { from, to };
    }

    const from = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const to = new Date(y, m, 0, 23, 59, 59, 999);
    return { from, to };
  };

  const toLocalYmd = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const setDateFilterValue = (id, ymd) => {
    if (window.PersianDatePicker) {
      window.PersianDatePicker.setValue(id, ymd || '', false);
      return;
    }
    const el = document.getElementById(id);
    if (el) el.value = ymd || '';
  };

  let monthPlaceCleanup = null;
  let monthPanelHost = null;

  let monthCloseTimer = null;
  const MONTH_ANIM_MS = 220;

  const closeMonthDropdown = () => {
    const root = document.getElementById('persian-month-select');
    const panel = document.getElementById('filter-month-panel');
    const trigger = document.getElementById('filter-month-trigger');
    if (root) root.classList.remove('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (monthPlaceCleanup) {
      monthPlaceCleanup();
      monthPlaceCleanup = null;
    }
    if (!panel) return;

    const finish = () => {
      panel.classList.remove('is-open', 'is-leaving');
      panel.hidden = true;
      panel.style.left = '';
      panel.style.top = '';
      panel.style.width = '';
      panel.style.maxWidth = '';
      if (monthPanelHost && panel.parentElement !== monthPanelHost) {
        monthPanelHost.appendChild(panel);
      }
      monthCloseTimer = null;
    };

    if (monthCloseTimer) {
      clearTimeout(monthCloseTimer);
      monthCloseTimer = null;
    }

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (panel.hidden || reduceMotion) {
      finish();
      return;
    }

    panel.classList.remove('is-open');
    panel.classList.add('is-leaving');
    monthCloseTimer = window.setTimeout(finish, MONTH_ANIM_MS);
  };

  const placeMonthPanel = () => {
    const panel = document.getElementById('filter-month-panel');
    const trigger = document.getElementById('filter-month-trigger');
    if (!panel || panel.hidden || !trigger) return;

    const margin = 8;
    const rect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(280, Math.max(180, vw - margin * 2));

    let left = document.documentElement.dir === 'rtl' ? rect.right - width : rect.left;
    left = Math.min(Math.max(left, margin), vw - width - margin);

    panel.style.position = 'fixed';
    panel.style.zIndex = '1090';
    panel.style.width = `${width}px`;
    panel.style.maxWidth = `${width}px`;
    panel.style.left = `${left}px`;
    panel.style.right = 'auto';
    panel.style.top = `${rect.bottom + 6}px`;

    const panelRect = panel.getBoundingClientRect();
    if (panelRect.bottom > vh - margin) {
      const above = Math.max(margin, rect.top - panelRect.height - 6);
      panel.style.top = `${above}px`;
    }
  };

  const openMonthDropdown = () => {
    const root = document.getElementById('persian-month-select');
    const panel = document.getElementById('filter-month-panel');
    const trigger = document.getElementById('filter-month-trigger');
    if (!panel || !trigger) return;
    if (ShopAdmin.ui && typeof ShopAdmin.ui.notifyOverlayOpen === 'function') {
      ShopAdmin.ui.notifyOverlayOpen('persian-month-select');
    }
    if (monthCloseTimer) {
      clearTimeout(monthCloseTimer);
      monthCloseTimer = null;
    }
    if (!monthPanelHost) monthPanelHost = panel.parentElement;
    // Portal to body so ancestors cannot clip the panel
    if (panel.parentElement !== document.body) {
      document.body.appendChild(panel);
    }
    root?.classList.add('is-open');
    panel.hidden = false;
    panel.classList.remove('is-leaving');
    panel.classList.remove('is-open');
    void panel.offsetWidth;
    requestAnimationFrame(() => panel.classList.add('is-open'));
    trigger.setAttribute('aria-expanded', 'true');
    placeMonthPanel();
    if (monthPlaceCleanup) monthPlaceCleanup();
    const onMove = () => placeMonthPanel();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    monthPlaceCleanup = () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  };

  const setMonthFilterValue = (key, { syncDates = true } = {}) => {
    const hidden = document.getElementById('filter-month');
    const labelEl = document.getElementById('filter-month-label');
    if (hidden) hidden.value = key || '';
    if (labelEl) {
      labelEl.textContent = labelForMonthKey(key);
      labelEl.classList.toggle('is-placeholder', !key);
    }
    document.querySelectorAll('.persian-month-select__option').forEach((btn) => {
      btn.classList.toggle('is-selected', (btn.dataset.value || '') === (key || ''));
    });
    if (syncDates && key) {
      const range = monthRange(key);
      if (range) {
        setDateFilterValue('filter-date-from', toLocalYmd(range.from));
        setDateFilterValue('filter-date-to', toLocalYmd(range.to));
      }
    }
  };

  /** Always include recent Persian months so the dropdown is never empty. */
  const availableMonths = () => {
    const map = new Map();

    const pushKey = (key, hasOrders = false) => {
      if (!key || map.has(key)) {
        if (key && map.has(key) && hasOrders) map.get(key).hasOrders = true;
        return;
      }
      const [year, month] = key.split('-').map(Number);
      map.set(key, {
        key,
        label: labelForMonthKey(key),
        year,
        month,
        hasOrders
      });
    };

    (rawData.orders || []).forEach((o) => {
      const key = monthKeyOf(o.createdAt);
      pushKey(key, true);
    });

    const now = new Date();
    let j = toJalaliParts(now);
    if (!j && window.PersianDatePicker?.toJalali) {
      j = window.PersianDatePicker.toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }
    if (j) {
      let jy = j.jy;
      let jm = j.jm;
      for (let i = 0; i < 18; i += 1) {
        pushKey(`${jy}-${String(jm).padStart(2, '0')}`, false);
        jm -= 1;
        if (jm < 1) {
          jm = 12;
          jy -= 1;
        }
      }
    } else {
      for (let i = 0; i < 12; i += 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        pushKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, false);
      }
    }

    return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
  };

  const renderMonthDropdown = () => {
    const list = document.getElementById('filter-month-list');
    if (!list) return;

    const months = availableMonths();
    const current = document.getElementById('filter-month')?.value || '';

    let html = `
      <button type="button" class="persian-month-select__option persian-month-select__all ${current ? '' : 'is-selected'}" data-value="" role="option">
        <span class="persian-month-select__option-name">همه ماه‌ها</span>
        <span class="persian-month-select__option-meta">بدون محدودیت</span>
      </button>`;

    let lastYear = null;
    months.forEach((m) => {
      if (m.year !== lastYear) {
        lastYear = m.year;
        html += `<div class="persian-month-select__year">سال ${toFaDigits(m.year)}</div>`;
      }
      const selected = current === m.key;
      const meta = m.hasOrders ? 'دارای سفارش' : toFaDigits(m.year);
      html += `
        <button type="button" class="persian-month-select__option ${selected ? 'is-selected' : ''}" data-value="${escapeHtml(m.key)}" role="option">
          <span class="persian-month-select__option-name">${escapeHtml(PERSIAN_MONTHS[m.month - 1] || m.label)}</span>
          <span class="persian-month-select__option-meta">${escapeHtml(meta)}</span>
        </button>`;
    });

    list.innerHTML = html;
    setMonthFilterValue(current, { syncDates: false });
  };

  const customerMatchesQuery = (customer, query) => {
    if (!customer || !query) return false;
    const q = normalizeText(query);
    if (!q) return false;

    const idStr = normalizeDigits(customer.id);
    if (idStr === q || String(customer.id) === q) return true;

    const first = normalizeText(customer.firstName);
    const last = normalizeText(customer.lastName);
    const full = normalizeText(customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`);
    const mobile = normalizeDigits(customer.mobile || customer.phone || '').replace(/\s+/g, '');
    const qDigits = q.replace(/\s+/g, '');

    return first.includes(q)
      || last.includes(q)
      || full.includes(q)
      || (qDigits && mobile.includes(qDigits));
  };

  const getFilteredOrders = () => {
    let orders = [...(rawData.orders || [])];
    const orderItems = rawData.orderItems || [];

    let dateFrom = filters.dateFrom;
    let dateTo = filters.dateTo;
    if (filters.monthKey) {
      const range = monthRange(filters.monthKey);
      if (range) {
        dateFrom = toLocalYmd(range.from);
        dateTo = toLocalYmd(range.to);
      }
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      orders = orders.filter((o) => new Date(o.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      orders = orders.filter((o) => new Date(o.createdAt) <= to);
    }

    if (filters.customerQuery) {
      const matchedIds = new Set(
        (rawData.customers || [])
          .filter((c) => customerMatchesQuery(c, filters.customerQuery))
          .map((c) => c.id)
      );
      orders = orders.filter((o) => matchedIds.has(o.customerId));
    }

    if (filters.orderStatus) {
      orders = orders.filter((o) => normalizeStatus(o.status) === filters.orderStatus);
    }
    if (filters.paymentStatus) {
      orders = orders.filter((o) => String(o.paymentStatus || '').toLowerCase() === filters.paymentStatus);
    }

    if (filters.productId || filters.categoryId) {
      const orderIds = new Set();
      orderItems.forEach((item) => {
        if (filters.productId && item.productId !== Number(filters.productId)) return;
        if (filters.categoryId) {
          const categoryId = item.categoryId
            ?? rawData.products.find((p) => p.id === item.productId)?.categoryId;
          if (Number(categoryId) !== Number(filters.categoryId)) return;
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
        const categoryId = i.categoryId
          ?? rawData.products.find((p) => p.id === i.productId)?.categoryId;
        return Number(categoryId) === Number(filters.categoryId);
      });
    }

    return items;
  };

  const getCustomerName = (customerId) => {
    const c = (rawData.customers || []).find((x) => x.id === customerId);
    if (!c) return '—';
    return c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || '—';
  };

  const getProductName = (productId) => {
    const p = (rawData.products || []).find((x) => x.id === productId);
    return p ? p.name : '—';
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'بدون دسته';
    const c = (rawData.categories || []).find((x) => x.id === categoryId);
    return c ? c.name : '—';
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

  const setPanelVisibility = () => {
    const type = filters.reportType || 'overview';
    document.querySelectorAll('[data-report-panel]').forEach((el) => {
      const modes = (el.dataset.reportPanel || '').trim().split(/\s+/).filter(Boolean);
      el.classList.toggle('d-none', modes.length > 0 && !modes.includes(type));
    });
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
        el.textContent = Number(value || 0).toLocaleString('fa-IR');
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
      if (Number.isNaN(d.getTime())) return;
      const key = toLocalYmd(d);
      buckets[key] = (buckets[key] || 0) + (Number(order.total) || 0);
    });

    const sorted = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).slice(-14);
    const maxTotal = Math.max(...sorted.map(([, v]) => v), 1);

    container.innerHTML = sorted.map(([date, total]) => {
      const heightPct = Math.round((total / maxTotal) * 100);
      const height = Math.max(heightPct, 8);
      const label = new Date(date).toLocaleDateString('fa-IR-u-ca-persian', { month: 'short', day: 'numeric' });
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

    tbody.innerHTML = top.map(([, data], i) => `
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
      if (!map[order.customerId]) map[order.customerId] = { count: 0, total: 0 };
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

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value.toLocaleString('fa-IR');
    };
    setText('review-total', total);
    setText('review-approved', approved);
    setText('review-pending', pending);
    setText('review-rejected', rejected);

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
            <div class="progress-bar bg-warning" style="width:${pct}%" role="progressbar"></div>
          </div>
          <span class="text-muted small" style="width:40px">${count.toLocaleString('fa-IR')}</span>
        </div>`;
    }).join('');
  };

  const renderMonthlyComparison = () => {
    const tbody = document.getElementById('monthly-report-body');
    const chart = document.getElementById('monthly-chart');
    if (!tbody) return;

    const savedMonth = filters.monthKey;
    const savedFrom = filters.dateFrom;
    const savedTo = filters.dateTo;
    filters.monthKey = '';
    filters.dateFrom = '';
    filters.dateTo = '';
    const orders = getFilteredOrders();
    filters.monthKey = savedMonth;
    filters.dateFrom = savedFrom;
    filters.dateTo = savedTo;

    const buckets = {};
    orders.forEach((order) => {
      const key = monthKeyOf(order.createdAt);
      if (!key) return;
      if (!buckets[key]) {
        buckets[key] = {
          key,
          label: labelForMonthKey(key),
          count: 0,
          paidCount: 0,
          revenue: 0,
          cancelled: 0
        };
      }
      buckets[key].count += 1;
      if (order.paymentStatus === 'paid') {
        buckets[key].paidCount += 1;
        buckets[key].revenue += Number(order.total) || 0;
      }
      if (normalizeStatus(order.status) === 'cancelled') buckets[key].cancelled += 1;
    });

    const rows = Object.values(buckets).sort((a, b) => b.key.localeCompare(a.key));
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">داده‌ای وجود ندارد.</td></tr>';
      if (chart) chart.innerHTML = '<p class="text-muted text-center w-100">داده‌ای برای نمایش وجود ندارد.</p>';
      return;
    }

    tbody.innerHTML = rows.map((row, i) => `
      <tr>
        <td>${(i + 1).toLocaleString('fa-IR')}</td>
        <td>${escapeHtml(row.label)}</td>
        <td>${row.count.toLocaleString('fa-IR')}</td>
        <td>${row.paidCount.toLocaleString('fa-IR')}</td>
        <td>${escapeHtml(formatPrice(row.revenue))}</td>
      </tr>
    `).join('');

    if (chart) {
      const chronological = [...rows].sort((a, b) => a.key.localeCompare(b.key));
      const maxRevenue = Math.max(...chronological.map((r) => r.revenue), 1);
      chart.innerHTML = chronological.map((row) => {
        const height = Math.max(Math.round((row.revenue / maxRevenue) * 100), 8);
        const title = `${row.label}: ${formatPrice(row.revenue)}`;
        return `
          <div class="chart-bar" style="height:${height}%" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">
            <span>${escapeHtml(row.label.replace(/\s+\S+$/, ''))}</span>
          </div>`;
      }).join('');
    }
  };

  const renderCategoryReport = (orders, orderItems) => {
    const tbody = document.getElementById('category-report-body');
    if (!tbody) return;

    const paidOrderIds = new Set(orders.filter((o) => o.paymentStatus === 'paid').map((o) => o.id));
    const map = {};

    orderItems.forEach((item) => {
      if (!paidOrderIds.has(item.orderId)) return;
      const product = (rawData.products || []).find((p) => p.id === item.productId);
      const categoryId = item.categoryId ?? product?.categoryId ?? 0;
      if (!map[categoryId]) {
        map[categoryId] = { name: getCategoryName(categoryId), qty: 0, revenue: 0, orders: new Set() };
      }
      map[categoryId].qty += Number(item.quantity) || 0;
      map[categoryId].revenue += Number(item.total) || 0;
      map[categoryId].orders.add(item.orderId);
    });

    const rows = Object.values(map).sort((a, b) => b.revenue - a.revenue);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">داده‌ای وجود ندارد.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((row, i) => `
      <tr>
        <td>${(i + 1).toLocaleString('fa-IR')}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${row.orders.size.toLocaleString('fa-IR')}</td>
        <td>${row.qty.toLocaleString('fa-IR')}</td>
        <td>${escapeHtml(formatPrice(row.revenue))}</td>
      </tr>
    `).join('');
  };

  const renderStatusReport = (orders) => {
    const tbody = document.getElementById('status-report-body');
    if (!tbody) return;

    const map = {};
    orders.forEach((o) => {
      const status = normalizeStatus(o.status);
      if (!map[status]) map[status] = { count: 0, total: 0 };
      map[status].count += 1;
      map[status].total += Number(o.total) || 0;
    });

    const rows = Object.entries(map).sort(([, a], [, b]) => b.count - a.count);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">داده‌ای وجود ندارد.</td></tr>';
      return;
    }

    const totalOrders = orders.length || 1;
    tbody.innerHTML = rows.map(([status, data], i) => {
      const pct = Math.round((data.count / totalOrders) * 100);
      return `
        <tr>
          <td>${(i + 1).toLocaleString('fa-IR')}</td>
          <td>${getStatusBadge(status, STATUS_LABELS[status])}</td>
          <td>${data.count.toLocaleString('fa-IR')} <span class="text-muted small">(${pct.toLocaleString('fa-IR')}٪)</span></td>
          <td>${escapeHtml(formatPrice(data.total))}</td>
        </tr>`;
    }).join('');
  };

  const renderPaymentReport = (orders) => {
    const tbody = document.getElementById('payment-report-body');
    if (!tbody) return;

    const map = {};
    orders.forEach((o) => {
      const key = o.paymentStatus || 'unknown';
      if (!map[key]) map[key] = { count: 0, total: 0 };
      map[key].count += 1;
      map[key].total += Number(o.total) || 0;
    });

    const rows = Object.entries(map).sort(([, a], [, b]) => b.total - a.total);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">داده‌ای وجود ندارد.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(([status, data], i) => `
      <tr>
        <td>${(i + 1).toLocaleString('fa-IR')}</td>
        <td>${getStatusBadge(status, PAYMENT_LABELS[status] || status)}</td>
        <td>${data.count.toLocaleString('fa-IR')}</td>
        <td>${escapeHtml(formatPrice(data.total))}</td>
      </tr>
    `).join('');
  };

  const renderAll = () => {
    setPanelVisibility();
    const report = computeReport();
    renderStats(report);

    const type = filters.reportType || 'overview';
    if (type === 'overview') {
      renderSalesChart(report.orders);
      renderTopProducts(report.orderItems);
      renderTopCustomers(report.orders);
      renderReviewStats(report.reviews);
    } else if (type === 'monthly') {
      renderMonthlyComparison();
    } else if (type === 'category') {
      renderCategoryReport(report.orders, report.orderItems);
    } else if (type === 'status') {
      renderStatusReport(report.orders);
    } else if (type === 'payment') {
      renderPaymentReport(report.orders);
    }
  };

  const populateProductOptions = (categoryId) => {
    const prodSel = document.getElementById('filter-product');
    if (!prodSel) return;
    const selected = prodSel.value;
    let products = rawData.products || [];
    if (categoryId) {
      products = products.filter((p) => Number(p.categoryId) === Number(categoryId));
    }
    products = [...products].sort((a, b) => String(a.name).localeCompare(String(b.name), 'fa'));
    prodSel.innerHTML = '<option value="">همه</option>'
      + products.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    if (selected && products.some((p) => String(p.id) === String(selected))) {
      prodSel.value = selected;
    }
  };

  const populateSelects = () => {
    const catSel = document.getElementById('filter-category');
    if (catSel) {
      const selected = catSel.value;
      catSel.innerHTML = '<option value="">همه</option>'
        + (rawData.categories || []).map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
      if (selected) catSel.value = selected;
    }
    populateProductOptions(document.getElementById('filter-category')?.value || '');
    renderMonthDropdown();
  };

  const readFilters = () => {
    filters = {
      reportType: document.getElementById('filter-report-type')?.value || 'overview',
      monthKey: document.getElementById('filter-month')?.value || '',
      dateFrom: document.getElementById('filter-date-from')?.value || '',
      dateTo: document.getElementById('filter-date-to')?.value || '',
      categoryId: document.getElementById('filter-category')?.value || '',
      productId: document.getElementById('filter-product')?.value || '',
      customerQuery: document.getElementById('filter-customer')?.value || '',
      orderStatus: document.getElementById('filter-order-status')?.value || '',
      paymentStatus: document.getElementById('filter-payment-status')?.value || ''
    };

    if (filters.monthKey) {
      const range = monthRange(filters.monthKey);
      if (range) {
        const fromYmd = toLocalYmd(range.from);
        const toYmd = toLocalYmd(range.to);
        setDateFilterValue('filter-date-from', fromYmd);
        setDateFilterValue('filter-date-to', toYmd);
        filters.dateFrom = fromYmd;
        filters.dateTo = toYmd;
      }
    }
  };

  const applyAndRender = () => {
    readFilters();
    renderAll();
  };

  const normalizeLocalDataset = (data) => {
    const products = data.products || [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    const orders = (data.orders || []).map((o) => {
      const status = normalizeStatus(o.status);
      return {
        ...o,
        status,
        paymentStatus: derivePaymentStatus(status, o.paymentStatus),
        total: Number(o.total ?? o.totalAmount) || 0,
        createdAt: o.createdAt || o.orderDate
      };
    });

    const orderItems = (data.orderItems || []).map((item) => {
      const product = productMap.get(item.productId);
      return {
        ...item,
        productName: item.productName || product?.name || `محصول #${item.productId}`,
        categoryId: item.categoryId ?? product?.categoryId ?? null,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        total: Number(item.total ?? (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0)) || 0
      };
    });

    const customers = (data.customers || []).map((c) => ({
      ...c,
      firstName: c.firstName || '',
      lastName: c.lastName || '',
      fullName: c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
      mobile: c.mobile || c.phone || ''
    }));

    return {
      orders,
      orderItems,
      products,
      categories: data.categories || [],
      customers,
      reviews: data.reviews || []
    };
  };

  const mapApiPayload = (payload, catalog) => {
    const orders = (payload.orders || payload.Orders || []).map((o) => {
      const status = normalizeStatus(o.status || o.Status);
      return {
        id: o.id ?? o.Id,
        orderNumber: o.orderNumber || o.OrderNumber || `ORD-${o.id ?? o.Id}`,
        customerId: o.customerId ?? o.CustomerId,
        status,
        paymentStatus: derivePaymentStatus(status, o.paymentStatus || o.PaymentStatus),
        total: Number(o.total ?? o.Total) || 0,
        createdAt: o.createdAt || o.CreatedAt
      };
    });

    const orderItems = (payload.orderItems || payload.OrderItems || []).map((item) => ({
      id: item.id ?? item.Id,
      orderId: item.orderId ?? item.OrderId,
      productId: item.productId ?? item.ProductId,
      productName: item.productName || item.ProductName || '',
      categoryId: item.categoryId ?? item.CategoryId ?? null,
      quantity: Number(item.quantity ?? item.Quantity) || 0,
      unitPrice: Number(item.unitPrice ?? item.UnitPrice) || 0,
      total: Number(item.total ?? item.Total) || 0
    }));

    const customers = (payload.customers || payload.Customers || []).map((c) => ({
      id: c.id ?? c.Id,
      firstName: c.firstName || c.FirstName || '',
      lastName: c.lastName || c.LastName || '',
      fullName: c.fullName || c.FullName || '',
      mobile: c.mobile || c.Mobile || '',
      email: c.email || c.Email || ''
    }));

    return {
      orders,
      orderItems,
      products: catalog.products || [],
      categories: catalog.categories || [],
      customers,
      reviews: catalog.reviews || []
    };
  };

  const emptyReportDataset = () => ({
    orders: [],
    orderItems: [],
    products: [],
    categories: [],
    customers: [],
    reviews: []
  });

  const loadReportData = async () => {
    rawData = emptyReportDataset();

    try {
      if (!ShopAdmin.api?.getSalesReport) {
        ShopAdmin.ui.showToast('warning', 'گزارش فروش از API در دسترس نیست.');
        return { source: 'api', orders: 0 };
      }
      await ShopAdmin.api.ensureApiAuth();
      const payload = await ShopAdmin.api.getSalesReport();
      rawData = mapApiPayload(payload, emptyReportDataset());
      return { source: 'api', orders: rawData.orders?.length || 0 };
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err));
      return { source: 'api', orders: 0 };
    }
  };

  const exportCsv = () => {
    const report = computeReport();
    const rows = [
      ['گزارش فروشگاه', formatDate(new Date())],
      ['نوع گزارش', filters.reportType],
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
    link.download = `shop-report-${toLocalYmd(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    ShopAdmin.ui.showToast('success', 'فایل CSV دانلود شد.');
  };

  const bindEvents = () => {
    document.getElementById('btn-apply-filters')?.addEventListener('click', applyAndRender);

    document.getElementById('filter-report-type')?.addEventListener('change', applyAndRender);

    document.getElementById('filter-category')?.addEventListener('change', () => {
      populateProductOptions(document.getElementById('filter-category')?.value || '');
      applyAndRender();
    });

    document.getElementById('filter-product')?.addEventListener('change', applyAndRender);
    document.getElementById('filter-order-status')?.addEventListener('change', applyAndRender);
    document.getElementById('filter-payment-status')?.addEventListener('change', applyAndRender);

    const debouncedCustomer = debounce(() => applyAndRender(), 300);
    document.getElementById('filter-customer')?.addEventListener('input', debouncedCustomer);

    const monthRoot = document.getElementById('persian-month-select');
    const monthTrigger = document.getElementById('filter-month-trigger');
    const monthPanel = document.getElementById('filter-month-panel');
    const monthList = document.getElementById('filter-month-list');

    if (ShopAdmin.ui && typeof ShopAdmin.ui.registerOverlay === 'function') {
      ShopAdmin.ui.registerOverlay('persian-month-select', closeMonthDropdown);
    }

    monthTrigger?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = Boolean(monthRoot?.classList.contains('is-open'));
      if (isOpen) closeMonthDropdown();
      else openMonthDropdown();
    });

    monthList?.addEventListener('click', (e) => {
      const btn = e.target.closest('.persian-month-select__option');
      if (!btn) return;
      const value = btn.dataset.value || '';
      closeMonthDropdown();
      setMonthFilterValue(value, { syncDates: Boolean(value) });
      if (!value) {
        setDateFilterValue('filter-date-from', '');
        setDateFilterValue('filter-date-to', '');
      }
      applyAndRender();
    });

    document.addEventListener('click', (e) => {
      if (
        !e.target.closest('#persian-month-select') &&
        !e.target.closest('#filter-month-panel')
      ) {
        closeMonthDropdown();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMonthDropdown();
    });

    document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
      ['filter-category', 'filter-product', 'filter-customer', 'filter-order-status', 'filter-payment-status']
        .forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
      setMonthFilterValue('', { syncDates: false });
      setDateFilterValue('filter-date-from', '');
      setDateFilterValue('filter-date-to', '');
      closeMonthDropdown();
      const typeEl = document.getElementById('filter-report-type');
      if (typeEl) typeEl.value = 'overview';
      populateProductOptions('');
      filters = {
        reportType: 'overview',
        monthKey: '',
        dateFrom: '',
        dateTo: '',
        categoryId: '',
        productId: '',
        customerQuery: '',
        orderStatus: '',
        paymentStatus: ''
      };
      renderAll();
    });

    document.getElementById('btn-export-csv')?.addEventListener('click', exportCsv);
    document.getElementById('btn-print')?.addEventListener('click', () => window.print());
  };

  const setLoading = (isLoading) => {
    const stats = document.getElementById('report-stats');
    if (stats) stats.classList.toggle('opacity-50', isLoading);
  };

  const initReports = async () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'گزارش‌ها' }
    ]);

    bindEvents();
    setLoading(true);

    // Wait briefly for catalog sync started by app.js
    await new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      document.addEventListener('admin:catalog-synced', finish, { once: true });
      setTimeout(finish, 2500);
    });

    const result = await loadReportData();
    populateSelects();
    applyAndRender();
    setLoading(false);

    if (result.source === 'api' && result.orders > 0) {
      ShopAdmin.ui.showToast('success', `گزارش از API: ${Number(result.orders || 0).toLocaleString('fa-IR')} سفارش`);
    } else if (!(result.orders > 0)) {
      ShopAdmin.ui.showToast('warning', 'سفارشی یافت نشد. API را اجرا کنید.');
    }
  };

  document.addEventListener('DOMContentLoaded', initReports);
})(window.ShopAdmin = window.ShopAdmin || {});
