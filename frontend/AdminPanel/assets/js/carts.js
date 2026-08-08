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
    return Number(product.price) || 0;
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
    lineCount: (cart.items || []).length,
    itemCount: (cart.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0),
    estimatedTotal: calcCartTotal(cart.items, products),
    isEmpty: !(cart.items || []).length
  });

  const normalizeDigits = (value) => String(value || '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

  const normalizeText = (value) => normalizeDigits(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  const customerMatchesQuery = (customer, query) => {
    if (!customer || !query) return false;
    const q = normalizeText(query);
    if (!q) return false;

    const idStr = normalizeDigits(customer.id);
    if (idStr === q || String(customer.id) === q) return true;

    const first = normalizeText(customer.firstName);
    const last = normalizeText(customer.lastName);
    const full = `${first} ${last}`.trim();
    const mobile = normalizeDigits(customer.mobile || '').replace(/\s+/g, '');
    const phone = normalizeDigits(customer.phone || '').replace(/\s+/g, '');
    const qDigits = q.replace(/\s+/g, '');

    return first.includes(q)
      || last.includes(q)
      || full.includes(q)
      || (qDigits && mobile.includes(qDigits))
      || (qDigits && phone.includes(qDigits));
  };

  const applyCartFilters = (carts, filters) => {
    let result = [...carts];

    if (filters.customerQuery) {
      const customers = customerRepo.getAll();
      const matchedIds = new Set(
        customers
          .filter((c) => customerMatchesQuery(c, filters.customerQuery))
          .map((c) => c.id)
      );
      result = result.filter((c) => matchedIds.has(c.customerId));
    }

    if (filters.status) {
      result = result.filter((c) => (c.status || 'active') === filters.status);
    }

    if (filters.itemCount !== undefined && filters.itemCount !== '') {
      if (filters.itemCount === '5plus') {
        result = result.filter((c) => c.lineCount >= 5);
      } else {
        const count = Number(filters.itemCount);
        if (!Number.isNaN(count)) {
          result = result.filter((c) => c.lineCount === count);
        }
      }
    }

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
              <th>تعداد</th>
              <th>قیمت واحد</th>
              <th>جمع</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="text-end fw-bold">مجموع تقریبی</td>
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
          <td>${cart.lineCount.toLocaleString('fa-IR')}</td>
          <td>${escapeHtml(formatPrice(cart.estimatedTotal))}</td>
          <td>${getStatusBadge(cart.status)}</td>
          <td class="text-muted small">${escapeHtml(formatDateTime(cart.updatedAt))}</td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn btn-outline-primary" data-action="view-cart" data-id="${cart.id}" title="جزئیات">
                <i class="bi bi-eye"></i>
              </button>
            </div>
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

  const init = () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'سبدهای خرید' }
    ]);

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
          if (window.PersianDatePicker) {
            window.PersianDatePicker.setValue('filter-dateFrom', '', false);
            window.PersianDatePicker.setValue('filter-dateTo', '', false);
          }
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
