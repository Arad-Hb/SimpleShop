/**
 * orders.js — لیست و جزئیات سفارش‌ها (متصل به API)
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml, formatPrice, formatDateTime, getStatusBadge, parseQuery } = ShopAdmin.utils;
  const { paginate, sortItems } = ShopAdmin.pagination;
  const { parseError } = window.SimpleShopHttp || {};
  const apiError = (err) => (parseError ? parseError(err) : (err?.message || 'خطا در ارتباط با سرور.'));

  const pick = (dto, camel, pascal) => dto?.[camel] ?? dto?.[pascal];

  const normalizeStatus = (status) => String(status || 'pending').trim().toLowerCase();

  const toApiStatus = (status) => {
    const s = normalizeStatus(status);
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const derivePaymentStatus = (status) => {
    const s = normalizeStatus(status);
    if (s === 'cancelled') return 'refunded';
    if (s === 'pending') return 'unpaid';
    return 'paid';
  };

  const mapListItem = (dto) => {
    const id = pick(dto, 'id', 'Id');
    const status = normalizeStatus(pick(dto, 'status', 'Status'));
    return {
      id,
      orderNumber: pick(dto, 'orderNumber', 'OrderNumber') || `ORD-${String(id).padStart(6, '0')}`,
      customerId: pick(dto, 'userId', 'UserId'),
      customerName: pick(dto, 'customerName', 'CustomerName') || '—',
      total: Number(pick(dto, 'totalAmount', 'TotalAmount') ?? pick(dto, 'total', 'Total') ?? 0),
      status,
      paymentStatus: normalizeStatus(
        pick(dto, 'paymentStatus', 'PaymentStatus') || derivePaymentStatus(status)
      ),
      createdAt: pick(dto, 'orderDate', 'OrderDate') || pick(dto, 'createdAt', 'CreatedAt'),
      itemCount: pick(dto, 'itemCount', 'ItemCount') ?? 0
    };
  };

  const mapDetails = (dto) => {
    const base = mapListItem(dto);
    const items = (pick(dto, 'items', 'Items') || []).map((line) => {
      const qty = Number(pick(line, 'quantity', 'Quantity')) || 0;
      const unitPrice = Number(pick(line, 'unitPrice', 'UnitPrice')) || 0;
      return {
        productId: pick(line, 'productId', 'ProductId'),
        productName: pick(line, 'productName', 'ProductName') || '—',
        quantity: qty,
        unitPrice,
        total: unitPrice * qty
      };
    });
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    return {
      ...base,
      shippingAddress: pick(dto, 'shippingAddress', 'ShippingAddress') || '',
      recipientName: pick(dto, 'recipientName', 'RecipientName') || '',
      recipientMobile: pick(dto, 'recipientMobile', 'RecipientMobile') || '',
      postalCode: pick(dto, 'postalCode', 'PostalCode') || '',
      customerNote: pick(dto, 'customerNote', 'CustomerNote') || '',
      adminNote: pick(dto, 'adminNote', 'AdminNote') || '',
      items,
      subtotal,
      shippingCost: Number(pick(dto, 'shippingCost', 'ShippingCost')) || 0,
      discount: Number(pick(dto, 'discount', 'Discount')) || 0,
      statusHistory: pick(dto, 'statusHistory', 'StatusHistory') || []
    };
  };

  const PAGE_SIZE = 10;
  const listState = { page: 1, filters: {}, orders: [], loading: false };

  const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

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

  const getStatusLabel = (status) => ShopAdmin.utils.STATUS_BADGES[normalizeStatus(status)]?.label || status;

  const applyOrderFilters = (orders, filters) => {
    let result = [...orders];

    if (filters.orderNumber) {
      const q = filters.orderNumber.trim().toLowerCase();
      result = result.filter((o) => (o.orderNumber || '').toLowerCase().includes(q));
    }
    if (filters.customerId) {
      result = result.filter((o) => String(o.customerId) === String(filters.customerId));
    }
    if (filters.status) result = result.filter((o) => o.status === normalizeStatus(filters.status));
    if (filters.paymentStatus) {
      result = result.filter((o) => o.paymentStatus === normalizeStatus(filters.paymentStatus));
    }

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

  const fetchAllOrders = async () => {
    const pageSize = 50;
    let pageIndex = 0;
    let all = [];
    let total = Infinity;

    while (all.length < total && pageIndex < 20) {
      const data = await ShopAdmin.api.searchOrders({ pageIndex, pageSize });
      const items = (data?.items || data?.Items || []).map(mapListItem);
      const search = data?.searchModel || data?.SearchModel || {};
      total = Number(search.recordCount ?? search.RecordCount ?? items.length) || items.length;
      all = all.concat(items);
      if (!items.length || items.length < pageSize) break;
      pageIndex += 1;
    }

    return all;
  };

  const renderOrdersList = () => {
    const tbody = document.getElementById('orders-body');
    if (!tbody) return;

    const filtered = applyOrderFilters(listState.orders, listState.filters);
    const { items, page, totalItems, totalPages } = paginate(filtered, listState.page, PAGE_SIZE);

    if (listState.loading) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">
        <span class="spinner-border spinner-border-sm me-2"></span>در حال بارگذاری...
      </td></tr>`;
      return;
    }

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-5"><i class="bi bi-cart-check display-6 d-block mb-2 opacity-50"></i>سفارشی یافت نشد</td></tr>';
    } else {
      tbody.innerHTML = items.map((order) => `
        <tr>
          <td><a href="order-details.html?id=${order.id}">${escapeHtml(order.orderNumber)}</a></td>
          <td>${escapeHtml(order.customerName)}</td>
          <td>${escapeHtml(formatPrice(order.total))}</td>
          <td>${getStatusBadge(order.status)}</td>
          <td>${getStatusBadge(order.paymentStatus)}</td>
          <td class="text-muted small">${escapeHtml(formatDateTime(order.createdAt))}</td>
          <td>
            <div class="table-actions">
              <a href="order-details.html?id=${order.id}" class="btn btn-outline-primary" title="جزئیات">
                <i class="bi bi-eye"></i>
              </a>
            </div>
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

  const loadOrdersList = async () => {
    const tbody = document.getElementById('orders-body');
    if (!tbody) return;

    listState.loading = true;
    renderOrdersList();

    try {
      await ShopAdmin.api.ensureApiAuth();
      listState.orders = await fetchAllOrders();
      populateCustomerFilter();
    } catch (err) {
      listState.orders = [];
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-5">${escapeHtml(apiError(err))}</td></tr>`;
      ShopAdmin.ui.showToast('error', apiError(err));
    } finally {
      listState.loading = false;
      renderOrdersList();
    }
  };

  const populateCustomerFilter = () => {
    const select = document.getElementById('filter-customer');
    if (!select) return;

    const current = select.value;
    while (select.options.length > 1) select.remove(1);

    const customers = new Map();
    listState.orders.forEach((o) => {
      if (o.customerId && !customers.has(o.customerId)) {
        customers.set(o.customerId, o.customerName || o.customerId);
      }
    });

    [...customers.entries()]
      .sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'fa'))
      .forEach(([id, name]) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = name;
        select.appendChild(opt);
      });

    if (current) select.value = current;
  };

  const initOrdersList = () => {
    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'سفارش‌ها' }
    ]);

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
          if (window.PersianDatePicker) {
            window.PersianDatePicker.setValue('filter-dateFrom', '', false);
            window.PersianDatePicker.setValue('filter-dateTo', '', false);
          }
          listState.filters = {};
          listState.page = 1;
          renderOrdersList();
        }, 0);
      });
    }

    loadOrdersList();
  };

  // ─── Detail page ─────────────────────────────────────────────

  let currentOrder = null;

  const renderOrderItems = (order) => {
    const items = order.items || [];
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
      container.innerHTML = `<p class="text-muted mb-0">وضعیت فعلی: ${getStatusBadge(order.status)}</p>`;
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
    document.getElementById('info-customer').textContent = order.customerName || '—';
    document.getElementById('info-createdAt').textContent = formatDateTime(order.createdAt);
    document.getElementById('info-recipient').textContent = order.recipientName || order.customerName || '—';
    document.getElementById('info-recipientMobile').textContent = order.recipientMobile || '—';
    document.getElementById('info-address').textContent = order.shippingAddress || '—';
    document.getElementById('info-postalCode').textContent = order.postalCode || '—';
    document.getElementById('info-customerNote').textContent = order.customerNote || '—';

    const statusSelect = document.getElementById('order-status');
    const paymentSelect = document.getElementById('payment-status');
    const adminNote = document.getElementById('admin-note');

    if (statusSelect) statusSelect.value = order.status;
    if (paymentSelect) {
      paymentSelect.value = order.paymentStatus;
      paymentSelect.disabled = true;
      paymentSelect.title = 'وضعیت پرداخت از API قابل ویرایش نیست.';
    }
    if (adminNote) {
      adminNote.value = order.adminNote || '';
      adminNote.disabled = true;
    }

    renderOrderItems(order);
    renderStatusHistory(order);

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'سفارش‌ها', href: 'orders.html' },
      { label: order.orderNumber }
    ]);
  };

  const handleSaveOrder = async () => {
    if (!currentOrder) return;

    const newStatus = normalizeStatus(document.getElementById('order-status').value);
    if (newStatus === currentOrder.status) {
      ShopAdmin.ui.showToast('info', 'تغییری اعمال نشد.');
      return;
    }

    const forward = FORWARD_TRANSITIONS[currentOrder.status] || [];
    const allowedForward = forward.includes(newStatus);
    let confirmMsg = null;

    if (!allowedForward && isBackwardTransition(currentOrder.status, newStatus)) {
      confirmMsg = `شما در حال بازگرداندن وضعیت از «${getStatusLabel(currentOrder.status)}» به «${getStatusLabel(newStatus)}» هستید. ادامه می‌دهید؟`;
    } else if (currentOrder.status === 'delivered' && newStatus !== 'delivered') {
      confirmMsg = 'این سفارش تحویل شده است. تغییر وضعیت نیاز به تأیید دارد. ادامه می‌دهید؟';
    } else if (currentOrder.status === 'cancelled' && newStatus !== 'cancelled') {
      confirmMsg = 'این سفارش لغو شده است. بازگردانی وضعیت نیاز به تأیید دارد. ادامه می‌دهید؟';
    }

    const doSave = async () => {
      try {
        await ShopAdmin.api.ensureApiAuth();
        const dto = await ShopAdmin.api.updateOrderStatus(currentOrder.id, toApiStatus(newStatus));
        currentOrder = mapDetails(dto);
        ShopAdmin.ui.showToast('success', 'وضعیت سفارش بروزرسانی شد.');
        renderOrderDetail(currentOrder);
      } catch (err) {
        ShopAdmin.ui.showToast('error', apiError(err));
      }
    };

    if (confirmMsg) {
      ShopAdmin.ui.showConfirmModal('تأیید تغییر', confirmMsg, doSave);
    } else {
      await doSave();
    }
  };

  const initOrderDetail = async () => {
    const params = parseQuery();
    const id = params.id ? Number(params.id) : null;

    if (!id) {
      document.getElementById('order-not-found')?.classList.remove('d-none');
      return;
    }

    try {
      await ShopAdmin.api.ensureApiAuth();
      const dto = await ShopAdmin.api.getOrder(id);
      if (!dto) {
        document.getElementById('order-not-found')?.classList.remove('d-none');
        return;
      }

      currentOrder = mapDetails(dto);
      renderOrderDetail(currentOrder);

      document.getElementById('save-order-btn')?.addEventListener('click', handleSaveOrder);

      document.getElementById('print-btn')?.addEventListener('click', () => {
        window.print();
      });

      const statusSelect = document.getElementById('order-status');
      statusSelect?.addEventListener('change', () => {
        const newVal = normalizeStatus(statusSelect.value);
        if ((currentOrder.status === 'delivered' || currentOrder.status === 'cancelled') && newVal !== currentOrder.status) {
          ShopAdmin.ui.showToast('warning', 'تغییر از وضعیت نهایی نیاز به تأیید هنگام ذخیره دارد.');
        }
      });
    } catch (err) {
      document.getElementById('order-not-found')?.classList.remove('d-none');
      ShopAdmin.ui.showToast('error', apiError(err));
    }
  };

  const init = () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    if (document.getElementById('orders-body')) initOrdersList();
    if (document.getElementById('order-content') || document.getElementById('order-not-found')) {
      initOrderDetail();
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.ShopAdmin = window.ShopAdmin || {});
