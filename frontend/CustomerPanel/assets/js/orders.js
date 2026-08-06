(function (ShopCustomer) {
  'use strict';

  const { escapeHtml, formatPrice, formatDateTime } = ShopCustomer.utils;
  const { parseError } = window.SimpleShopHttp || {};
  const apiError = (err) => (parseError ? parseError(err) : (err?.message || 'خطا در ارتباط با سرور.'));

  const pick = (dto, camel, pascal) => dto?.[camel] ?? dto?.[pascal];

  const normalizeStatus = (status) => {
    const s = String(status || 'pending').trim().toLowerCase();
    if (s === 'shipped' || s === 'processing') return 'shipping';
    return s;
  };

  const derivePaymentStatus = (status) => {
    const s = String(status || '').trim().toLowerCase();
    if (s === 'cancelled') return 'cancelled';
    if (s === 'pending') return 'unpaid';
    return 'paid';
  };

  const mapOrder = (dto) => {
    const id = pick(dto, 'id', 'Id');
    const rawStatus = pick(dto, 'status', 'Status');
    const status = normalizeStatus(rawStatus);
    const items = (pick(dto, 'items', 'Items') || []).map((line) => ({
      name: pick(line, 'productName', 'ProductName') || '—',
      qty: pick(line, 'quantity', 'Quantity') ?? 1,
      price: Number(pick(line, 'unitPrice', 'UnitPrice')) || 0
    }));

    return {
      id,
      orderNumber: pick(dto, 'orderNumber', 'OrderNumber') || `ORD-${String(id).padStart(6, '0')}`,
      status,
      paymentStatus: normalizeStatus(
        pick(dto, 'paymentStatus', 'PaymentStatus') || derivePaymentStatus(rawStatus)
      ),
      total: Number(pick(dto, 'totalAmount', 'TotalAmount') ?? pick(dto, 'total', 'Total') ?? 0),
      createdAt: pick(dto, 'orderDate', 'OrderDate') || pick(dto, 'createdAt', 'CreatedAt'),
      shippingAddress: pick(dto, 'shippingAddress', 'ShippingAddress') || '',
      items: items.length ? items : new Array(pick(dto, 'itemCount', 'ItemCount') || 0).fill(null).map(() => null)
    };
  };

  const statusLabel = {
    delivered: 'تحویل‌شده',
    shipping: 'در حال ارسال',
    pending: 'در انتظار تأیید',
    cancelled: 'لغو‌شده'
  };

  const paymentLabel = {
    paid: 'پرداخت‌شده',
    unpaid: 'پرداخت‌نشده',
    cancelled: 'لغو‌شده'
  };

  let ordersCache = [];
  let currentPage = 1;
  let filterStatus = '';
  let filterPayment = '';
  let searchQuery = '';

  const getFiltered = () => {
    let list = ordersCache.slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (filterStatus) list = list.filter((o) => o.status === filterStatus);
    if (filterPayment) list = list.filter((o) => o.paymentStatus === filterPayment);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((o) =>
        String(o.orderNumber || '').toLowerCase().includes(q) ||
        (o.items || []).some((i) => i && String(i.name || '').toLowerCase().includes(q))
      );
    }
    return list;
  };

  const openDetail = (order) => {
    const modal = document.getElementById('order-detail-modal');
    if (!modal || !order) return;

    modal.querySelector('[data-order-number]').textContent = order.orderNumber;
    modal.querySelector('[data-order-status]').innerHTML =
      `<span class="order-status order-status--${escapeHtml(order.status)}">${escapeHtml(statusLabel[order.status] || order.status)}</span>`;
    modal.querySelector('[data-order-payment]').innerHTML =
      `<span class="payment-status payment-status--${escapeHtml(order.paymentStatus)}">${escapeHtml(paymentLabel[order.paymentStatus] || order.paymentStatus)}</span>`;
    modal.querySelector('[data-order-date]').textContent = formatDateTime(order.createdAt);
    modal.querySelector('[data-order-address]').textContent = order.shippingAddress || '—';
    modal.querySelector('[data-order-total]').textContent = formatPrice(order.total);

    const itemsEl = modal.querySelector('[data-order-items]');
    const validItems = (order.items || []).filter(Boolean);
    itemsEl.innerHTML = validItems.map((item) => `
      <li>
        <span>${escapeHtml(item.name)} × ${Number(item.qty || 1).toLocaleString('fa-IR')}</span>
        <strong>${formatPrice((item.price || 0) * (item.qty || 1))}</strong>
      </li>
    `).join('') || `<li><span class="text-muted">${(order.items?.length || 0).toLocaleString('fa-IR')} کالا</span></li>`;

    ShopCustomer.ui.showModal(modal);
  };

  const render = () => {
    const body = document.getElementById('orders-body');
    const empty = document.getElementById('orders-empty');
    const info = document.getElementById('pagination-info');
    const pager = document.getElementById('pagination');
    if (!body) return;

    const filtered = getFiltered();
    const pageData = ShopCustomer.ui.paginate(filtered, currentPage, 8);
    currentPage = pageData.page;

    if (!pageData.totalItems) {
      body.innerHTML = '';
      empty?.classList.remove('d-none');
      if (info) info.textContent = '';
      if (pager) pager.innerHTML = '';
      return;
    }

    empty?.classList.add('d-none');
    body.innerHTML = pageData.items.map((o) => `
      <tr>
        <td><strong>${escapeHtml(o.orderNumber)}</strong></td>
        <td><span class="order-status order-status--${escapeHtml(o.status)}">${escapeHtml(statusLabel[o.status] || o.status)}</span></td>
        <td><span class="payment-status payment-status--${escapeHtml(o.paymentStatus)}">${escapeHtml(paymentLabel[o.paymentStatus] || o.paymentStatus)}</span></td>
        <td>${(o.items || []).filter(Boolean).length || o.items?.length || 0} کالا</td>
        <td>${formatPrice(o.total)}</td>
        <td>${formatDateTime(o.createdAt)}</td>
        <td class="text-center">
          <button type="button" class="btn btn-sm btn-outline-primary" data-view="${escapeHtml(o.id)}">جزئیات</button>
        </td>
      </tr>
    `).join('');

    body.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const cached = ordersCache.find((o) => String(o.id) === String(btn.dataset.view));
        if (cached?.items?.some(Boolean)) {
          openDetail(cached);
          return;
        }
        try {
          await ShopCustomer.api.ensureApiAuth();
          const dto = await ShopCustomer.api.getOrder(btn.dataset.view);
          openDetail(mapOrder(dto));
        } catch (err) {
          ShopCustomer.ui.showToast?.('error', apiError(err));
        }
      });
    });

    if (info) {
      const from = (pageData.page - 1) * pageData.pageSize + 1;
      const to = Math.min(pageData.page * pageData.pageSize, pageData.totalItems);
      info.textContent = `نمایش ${from.toLocaleString('fa-IR')} تا ${to.toLocaleString('fa-IR')} از ${pageData.totalItems.toLocaleString('fa-IR')} مورد`;
    }

    ShopCustomer.ui.renderPagination(pager, pageData.page, pageData.totalPages, (page) => {
      currentPage = page;
      render();
    });
  };

  const loadOrders = async () => {
    const body = document.getElementById('orders-body');
    if (body) {
      body.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">
        <span class="spinner-border spinner-border-sm me-2"></span>در حال بارگذاری...
      </td></tr>`;
    }

    try {
      await ShopCustomer.api.ensureApiAuth();
      const pageSize = 50;
      let pageIndex = 0;
      let all = [];
      let total = Infinity;

      while (all.length < total && pageIndex < 10) {
        const data = await ShopCustomer.api.searchOrders({ pageIndex, pageSize });
        const items = (data?.items || data?.Items || []).map(mapOrder);
        const search = data?.searchModel || data?.SearchModel || {};
        total = Number(search.recordCount ?? search.RecordCount ?? items.length) || items.length;
        all = all.concat(items);
        if (!items.length || items.length < pageSize) break;
        pageIndex += 1;
      }

      ordersCache = all;
    } catch (err) {
      ordersCache = [];
      ShopCustomer.ui.showToast?.('error', apiError(err));
    }

    render();
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (!ShopCustomer.auth.requireAuth()) return;

    ShopCustomer.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'سفارش‌های من' }
    ]);

    document.getElementById('filter-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      searchQuery = document.getElementById('search').value.trim();
      filterStatus = document.getElementById('filter-status').value;
      filterPayment = document.getElementById('filter-payment').value;
      currentPage = 1;
      render();
    });

    document.getElementById('btn-reset')?.addEventListener('click', () => {
      document.getElementById('search').value = '';
      document.getElementById('filter-status').value = '';
      document.getElementById('filter-payment').value = '';
      searchQuery = '';
      filterStatus = '';
      filterPayment = '';
      currentPage = 1;
      render();
      ShopCustomer.ui.enhanceFormSelects(document);
    });

    loadOrders();

    const params = new URLSearchParams(window.location.search);
    const focusId = params.get('id');
    if (focusId) {
      ShopCustomer.api.getOrder(focusId).then((dto) => openDetail(mapOrder(dto))).catch(() => {});
    }
  });
})(window.ShopCustomer = window.ShopCustomer || {});
