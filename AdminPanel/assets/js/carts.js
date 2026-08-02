/**
 * carts.js — مدیریت سبدهای خرید
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml, formatPrice, formatDateTime, getStatusBadge } = ShopAdmin.utils;
  const { paginate, sortItems } = ShopAdmin.pagination;

  const cartRepo = ShopAdmin.storage.createRepository('carts');
  const customerRepo = ShopAdmin.storage.createRepository('customers');
  const productRepo = ShopAdmin.storage.createRepository('products');

  const PAGE_SIZE = 10;
  const listState = { page: 1, filters: {} };

  const getCustomerName = (customerId) => {
    const c = customerRepo.getById(customerId);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };

  const getProductPrice = (product) => {
    if (!product) return 0;
    return Number(product.discountPrice ?? product.price) || 0;
  };

  const calcCartTotal = (items, products) => {
    if (!items?.length) return 0;
    return items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + getProductPrice(product) * (Number(item.quantity) || 0);
    }, 0);
  };

  const enrichCart = (cart, products) => ({
    ...cart,
    status: cart.status || 'active',
    itemCount: (cart.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0),
    estimatedTotal: calcCartTotal(cart.items, products),
    isEmpty: !(cart.items || []).length
  });

  const applyCartFilters = (carts, filters) => {
    let result = [...carts];

    if (filters.customerId) {
      result = result.filter((c) => c.customerId === Number(filters.customerId));
    }
    if (filters.status) {
      result = result.filter((c) => (c.status || 'active') === filters.status);
    }
    if (filters.empty === 'yes') result = result.filter((c) => c.isEmpty);
    if (filters.empty === 'no') result = result.filter((c) => !c.isEmpty);

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((c) => new Date(c.updatedAt) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((c) => new Date(c.updatedAt) <= to);
    }

    return sortItems(result, 'updatedAt', 'desc');
  };

  const renderCartDetail = (cart) => {
    const products = productRepo.getAll();
    const body = document.getElementById('cart-detail-body');
    const title = document.getElementById('cart-detail-title');
    if (!body || !title) return;

    title.textContent = `سبد خرید #${cart.id.toLocaleString('fa-IR')} — ${getCustomerName(cart.customerId)}`;

    const items = cart.items || [];
    if (!items.length) {
      body.innerHTML = '<p class="text-muted text-center py-3">این سبد خالی است.</p>';
      return;
    }

    const rows = items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const unitPrice = getProductPrice(product);
      const qty = Number(item.quantity) || 0;
      const lineTotal = unitPrice * qty;
      return `
        <tr>
          <td>${escapeHtml(product?.name || `محصول #${item.productId}`)}</td>
          <td>${escapeHtml(product?.sku || '—')}</td>
          <td>${qty.toLocaleString('fa-IR')}</td>
          <td>${escapeHtml(formatPrice(unitPrice))}</td>
          <td>${escapeHtml(formatPrice(lineTotal))}</td>
        </tr>
      `;
    }).join('');

    const total = calcCartTotal(items, products);

    body.innerHTML = `
      <div class="mb-3 d-flex flex-wrap gap-3 small">
        <span><strong>مشتری:</strong> ${escapeHtml(getCustomerName(cart.customerId))}</span>
        <span><strong>وضعیت:</strong> ${getStatusBadge(cart.status || 'active')}</span>
        <span><strong>بروزرسانی:</strong> ${escapeHtml(formatDateTime(cart.updatedAt))}</span>
      </div>
      <div class="table-responsive">
        <table class="table admin-table mb-0">
          <thead>
            <tr>
              <th>محصول</th>
              <th>SKU</th>
              <th>تعداد</th>
              <th>قیمت واحد</th>
              <th>جمع</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="text-end fw-bold">مجموع تقریبی</td>
              <td class="fw-bold">${escapeHtml(formatPrice(total))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  };

  const showCartModal = (cartId) => {
    const cart = cartRepo.getById(cartId);
    if (!cart) {
      ShopAdmin.ui.showToast('error', 'سبد یافت نشد.');
      return;
    }
    renderCartDetail(cart);
    const modalEl = document.getElementById('cart-detail-modal');
    if (modalEl) ShopAdmin.ui.showModal(modalEl);
  };

  const renderCartsList = () => {
    const tbody = document.getElementById('carts-body');
    if (!tbody) return;

    const products = productRepo.getAll();
    const all = cartRepo.getAll().map((c) => enrichCart(c, products));
    const filtered = applyCartFilters(all, listState.filters);
    const { items, page, totalItems, totalPages } = paginate(filtered, listState.page, PAGE_SIZE);

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-5"><i class="bi bi-basket display-6 d-block mb-2 opacity-50"></i>سبدی یافت نشد</td></tr>';
    } else {
      tbody.innerHTML = items.map((cart) => `
        <tr>
          <td>${cart.id.toLocaleString('fa-IR')}</td>
          <td>${escapeHtml(getCustomerName(cart.customerId))}</td>
          <td>${cart.itemCount.toLocaleString('fa-IR')}</td>
          <td>${escapeHtml(formatPrice(cart.estimatedTotal))}</td>
          <td>${getStatusBadge(cart.status)}</td>
          <td class="text-muted small">${escapeHtml(formatDateTime(cart.updatedAt))}</td>
          <td>
            <button type="button" class="btn btn-sm btn-outline-primary" data-action="view-cart" data-id="${cart.id}">
              <i class="bi bi-eye"></i> جزئیات
            </button>
          </td>
        </tr>
      `).join('');
    }

    const infoEl = document.getElementById('pagination-info');
    if (infoEl) {
      infoEl.textContent = totalItems
        ? `نمایش ${((page - 1) * PAGE_SIZE + 1).toLocaleString('fa-IR')} تا ${Math.min(page * PAGE_SIZE, totalItems).toLocaleString('fa-IR')} از ${totalItems.toLocaleString('fa-IR')} سبد`
        : '';
    }

    ShopAdmin.ui.renderPagination(document.getElementById('pagination'), page, totalPages, (p) => {
      listState.page = p;
      renderCartsList();
    });

    tbody.querySelectorAll('[data-action="view-cart"]').forEach((btn) => {
      btn.addEventListener('click', () => showCartModal(Number(btn.dataset.id)));
    });
  };

  const populateCustomerFilter = () => {
    const select = document.getElementById('filter-customer');
    if (!select) return;
    const customers = sortItems(customerRepo.getAll(), 'lastName', 'asc');
    customers.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.firstName} ${c.lastName}`;
      select.appendChild(opt);
    });
  };

  const init = () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'سبدهای خرید' }
    ]);

    populateCustomerFilter();

    const form = document.getElementById('filter-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        listState.filters = Object.fromEntries(new FormData(form).entries());
        listState.page = 1;
        renderCartsList();
      });
      form.addEventListener('reset', () => {
        setTimeout(() => {
          listState.filters = {};
          listState.page = 1;
          renderCartsList();
        }, 0);
      });
    }

    renderCartsList();
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.ShopAdmin = window.ShopAdmin || {});
