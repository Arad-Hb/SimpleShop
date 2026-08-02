/**
 * orders.js — لیست و جزئیات سفارش‌ها
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml, formatPrice, formatDateTime, getStatusBadge, parseQuery } = ShopAdmin.utils;
  const { paginate, sortItems } = ShopAdmin.pagination;

  const orderRepo = ShopAdmin.storage.createRepository('orders');
  const orderItemRepo = ShopAdmin.storage.createRepository('orderItems');
  const customerRepo = ShopAdmin.storage.createRepository('customers');

  const PAGE_SIZE = 10;
  const listState = { page: 1, filters: {} };

  const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'];

  const STATUS_ORDER = { pending: 0, processing: 1, shipped: 2, delivered: 3, cancelled: 4 };

  const FORWARD_TRANSITIONS = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: []
  };

  const isBackwardTransition = (from, to) => {
    if (from === to) return false;
    if (from === 'delivered' || from === 'cancelled') return true;
    if (from === 'shipped' && STATUS_ORDER[to] < STATUS_ORDER.shipped && to !== 'cancelled') return true;
    if (from === 'processing' && STATUS_ORDER[to] < STATUS_ORDER.processing) return true;
    return false;
  };

  const getCustomerName = (customerId) => {
    const c = customerRepo.getById(customerId);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };

  const getStatusLabel = (status) => ShopAdmin.utils.STATUS_BADGES[status]?.label || status;

  // ─── List page ───────────────────────────────────────────────

  const applyOrderFilters = (orders, filters) => {
    let result = [...orders];

    if (filters.orderNumber) {
      const q = filters.orderNumber.trim().toLowerCase();
      result = result.filter((o) => (o.orderNumber || '').toLowerCase().includes(q));
    }
    if (filters.customerId) {
      result = result.filter((o) => o.customerId === Number(filters.customerId));
    }
    if (filters.status) result = result.filter((o) => o.status === filters.status);
    if (filters.paymentStatus) result = result.filter((o) => o.paymentStatus === filters.paymentStatus);

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((o) => new Date(o.createdAt) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((o) => new Date(o.createdAt) <= to);
    }
    if (filters.minTotal) {
      const min = Number(filters.minTotal);
      if (!Number.isNaN(min)) result = result.filter((o) => (Number(o.total) || 0) >= min);
    }

    if (filters.sort) {
      const [field, dir] = filters.sort.split('-');
      result = sortItems(result, field, dir);
    } else {
      result = sortItems(result, 'createdAt', 'desc');
    }

    return result;
  };

  const renderOrdersList = () => {
    const tbody = document.getElementById('orders-body');
    if (!tbody) return;

    const all = orderRepo.getAll();
    const filtered = applyOrderFilters(all, listState.filters);
    const { items, page, totalItems, totalPages } = paginate(filtered, listState.page, PAGE_SIZE);

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-5"><i class="bi bi-cart-check display-6 d-block mb-2 opacity-50"></i>سفارشی یافت نشد</td></tr>';
    } else {
      tbody.innerHTML = items.map((order) => `
        <tr>
          <td><a href="order-details.html?id=${order.id}">${escapeHtml(order.orderNumber)}</a></td>
          <td>${escapeHtml(getCustomerName(order.customerId))}</td>
          <td>${escapeHtml(formatPrice(order.total))}</td>
          <td>${getStatusBadge(order.status)}</td>
          <td>${getStatusBadge(order.paymentStatus)}</td>
          <td class="text-muted small">${escapeHtml(formatDateTime(order.createdAt))}</td>
          <td>
            <a href="order-details.html?id=${order.id}" class="btn btn-sm btn-outline-primary">
              <i class="bi bi-eye"></i> جزئیات
            </a>
          </td>
        </tr>
      `).join('');
    }

    const infoEl = document.getElementById('pagination-info');
    if (infoEl) {
      infoEl.textContent = totalItems
        ? `نمایش ${((page - 1) * PAGE_SIZE + 1).toLocaleString('fa-IR')} تا ${Math.min(page * PAGE_SIZE, totalItems).toLocaleString('fa-IR')} از ${totalItems.toLocaleString('fa-IR')} سفارش`
        : '';
    }

    ShopAdmin.ui.renderPagination(document.getElementById('pagination'), page, totalPages, (p) => {
      listState.page = p;
      renderOrdersList();
    });
  };

  const populateCustomerFilter = () => {
    const select = document.getElementById('filter-customer');
    if (!select) return;
    sortItems(customerRepo.getAll(), 'lastName', 'asc').forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.firstName} ${c.lastName}`;
      select.appendChild(opt);
    });
  };

  const initOrdersList = () => {
    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'سفارش‌ها' }
    ]);

    populateCustomerFilter();

    const form = document.getElementById('filter-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        listState.filters = Object.fromEntries(new FormData(form).entries());
        listState.page = 1;
        renderOrdersList();
      });
      form.addEventListener('reset', () => {
        setTimeout(() => {
          listState.filters = {};
          listState.page = 1;
          renderOrdersList();
        }, 0);
      });
    }

    renderOrdersList();
  };

  // ─── Detail page ─────────────────────────────────────────────

  let currentOrderId = null;

  const renderOrderItems = (order) => {
    const items = orderItemRepo.getAll().filter((i) => i.orderId === order.id);
    const tbody = document.getElementById('order-items-body');
    const tfoot = document.getElementById('order-items-foot');
    if (!tbody) return;

    tbody.innerHTML = items.length
      ? items.map((item) => `
          <tr>
            <td>${escapeHtml(item.productName || '—')}</td>
            <td>${(Number(item.quantity) || 0).toLocaleString('fa-IR')}</td>
            <td>${escapeHtml(formatPrice(item.unitPrice))}</td>
            <td>${escapeHtml(formatPrice(item.total))}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="4" class="text-center text-muted py-3">آیتمی ثبت نشده</td></tr>';

    if (tfoot) {
      tfoot.innerHTML = `
        <tr><td colspan="3" class="text-end">جمع جزء</td><td>${escapeHtml(formatPrice(order.subtotal))}</td></tr>
        <tr><td colspan="3" class="text-end">هزینه ارسال</td><td>${escapeHtml(formatPrice(order.shippingCost))}</td></tr>
        <tr><td colspan="3" class="text-end">تخفیف</td><td class="text-danger">-${escapeHtml(formatPrice(order.discount))}</td></tr>
        <tr class="fw-bold"><td colspan="3" class="text-end">مبلغ کل</td><td>${escapeHtml(formatPrice(order.total))}</td></tr>
      `;
    }
  };

  const renderStatusHistory = (order) => {
    const container = document.getElementById('status-history');
    if (!container) return;

    const history = [...(order.statusHistory || [])].sort(
      (a, b) => new Date(b.at) - new Date(a.at)
    );

    if (!history.length) {
      container.innerHTML = '<p class="text-muted mb-0">تاریخچه‌ای ثبت نشده است.</p>';
      return;
    }

    container.innerHTML = history.map((entry) => `
      <div class="status-timeline-item">
        <div class="d-flex align-items-center gap-2 mb-1">
          ${getStatusBadge(entry.status)}
          <span class="text-muted small">${escapeHtml(formatDateTime(entry.at))}</span>
        </div>
        ${entry.note ? `<p class="small mb-0 text-muted">${escapeHtml(entry.note)}</p>` : ''}
        ${entry.by ? `<span class="badge bg-light text-dark small">${escapeHtml(entry.by === 'admin' ? 'مدیر' : entry.by)}</span>` : ''}
      </div>
    `).join('');
  };

  const renderOrderDetail = (order) => {
    document.getElementById('order-content')?.classList.remove('d-none');
    document.getElementById('order-not-found')?.classList.add('d-none');

    document.getElementById('order-title').textContent = `سفارش ${order.orderNumber}`;
    document.getElementById('print-order-number').textContent = order.orderNumber;

    document.getElementById('info-orderNumber').textContent = order.orderNumber;
    document.getElementById('info-customer').innerHTML = `<a href="customer-form.html?id=${order.customerId}">${escapeHtml(getCustomerName(order.customerId))}</a>`;
    document.getElementById('info-createdAt').textContent = formatDateTime(order.createdAt);
    document.getElementById('info-recipient').textContent = order.recipientName || '—';
    document.getElementById('info-recipientMobile').textContent = order.recipientMobile || '—';
    document.getElementById('info-address').textContent = order.shippingAddress || '—';
    document.getElementById('info-postalCode').textContent = order.postalCode || '—';
    document.getElementById('info-customerNote').textContent = order.customerNote || order.notes || '—';

    const statusSelect = document.getElementById('order-status');
    const paymentSelect = document.getElementById('payment-status');
    const adminNote = document.getElementById('admin-note');

    if (statusSelect) statusSelect.value = order.status;
    if (paymentSelect) paymentSelect.value = order.paymentStatus;
    if (adminNote) adminNote.value = order.adminNote || '';

    renderOrderItems(order);
    renderStatusHistory(order);

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'سفارش‌ها', href: 'orders.html' },
      { label: order.orderNumber }
    ]);
  };

  const appendStatusHistory = (order, newStatus, note) => {
    const history = [...(order.statusHistory || [])];
    history.push({
      status: newStatus,
      at: new Date().toISOString(),
      by: 'admin',
      note: note || `تغییر وضعیت به ${getStatusLabel(newStatus)}`
    });
    return history;
  };

  const saveOrderChanges = (order, updates, confirmMessage) => {
    const doSave = () => {
      orderRepo.update(order.id, updates);
      ShopAdmin.ui.showToast('success', 'سفارش بروزرسانی شد.');
      const updated = orderRepo.getById(order.id);
      renderOrderDetail(updated);
    };

    if (confirmMessage) {
      ShopAdmin.ui.showConfirmModal('تأیید تغییر', confirmMessage, doSave);
    } else {
      doSave();
    }
  };

  const handleSaveOrder = () => {
    const order = orderRepo.getById(currentOrderId);
    if (!order) return;

    const newStatus = document.getElementById('order-status').value;
    const newPayment = document.getElementById('payment-status').value;
    const adminNote = document.getElementById('admin-note').value.trim();

    const updates = { adminNote };
    let confirmMsg = null;

    if (newStatus !== order.status) {
      const forward = FORWARD_TRANSITIONS[order.status] || [];
      const allowedForward = forward.includes(newStatus);

      if (!allowedForward && isBackwardTransition(order.status, newStatus)) {
        confirmMsg = `شما در حال بازگرداندن وضعیت از «${getStatusLabel(order.status)}» به «${getStatusLabel(newStatus)}» هستید. این عمل غیرمعمول است. ادامه می‌دهید؟`;
      } else if (order.status === 'delivered' && newStatus !== 'delivered') {
        confirmMsg = 'این سفارش تحویل شده است. تغییر وضعیت نیاز به تأیید دارد. ادامه می‌دهید؟';
      } else if (order.status === 'cancelled' && newStatus !== 'cancelled') {
        confirmMsg = 'این سفارش لغو شده است. بازگردانی وضعیت نیاز به تأیید دارد. ادامه می‌دهید؟';
      }

      updates.status = newStatus;
      updates.statusHistory = appendStatusHistory(order, newStatus, `تغییر وضعیت توسط مدیر`);
    }

    if (newPayment !== order.paymentStatus) {
      if (order.paymentStatus === 'refunded' && newPayment !== 'refunded') {
        const paymentConfirm = 'وضعیت پرداخت از مرجوعی تغییر می‌کند. ادامه می‌دهید؟';
        confirmMsg = confirmMsg ? `${confirmMsg}\n${paymentConfirm}` : paymentConfirm;
      }
      updates.paymentStatus = newPayment;
    }

    saveOrderChanges(order, updates, confirmMsg);
  };

  const initOrderDetail = () => {
    const params = parseQuery();
    const id = params.id ? Number(params.id) : null;

    if (!id) {
      document.getElementById('order-not-found')?.classList.remove('d-none');
      return;
    }

    const order = orderRepo.getById(id);
    if (!order) {
      document.getElementById('order-not-found')?.classList.remove('d-none');
      return;
    }

    currentOrderId = id;
    renderOrderDetail(order);

    document.getElementById('save-order-btn')?.addEventListener('click', handleSaveOrder);

    document.getElementById('print-btn')?.addEventListener('click', () => {
      window.print();
    });

    const statusSelect = document.getElementById('order-status');
    statusSelect?.addEventListener('change', () => {
      const order = orderRepo.getById(currentOrderId);
      const newVal = statusSelect.value;
      if (order && (order.status === 'delivered' || order.status === 'cancelled') && newVal !== order.status) {
        ShopAdmin.ui.showToast('warning', 'تغییر از وضعیت نهایی نیاز به تأیید هنگام ذخیره دارد.');
      }
    });
  };

  // ─── Init ────────────────────────────────────────────────────

  const init = () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    if (document.getElementById('orders-body')) initOrdersList();
    if (document.getElementById('order-content') || document.getElementById('order-not-found')) {
      initOrderDetail();
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.ShopAdmin = window.ShopAdmin || {});
