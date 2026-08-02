/**
 * ui.js — اجزای رابط کاربری مشترک
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml } = ShopAdmin.utils || { escapeHtml: (s) => String(s) };

  // ─── Sidebar ─────────────────────────────────────────────────

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'داشبورد', icon: 'bi-speedometer2', href: 'index.html' },
    { id: 'categories', label: 'دسته‌بندی‌ها', icon: 'bi-tags', href: 'categories.html' },
    { id: 'suppliers', label: 'تأمین‌کنندگان', icon: 'bi-truck', href: 'suppliers.html' },
    { id: 'products', label: 'محصولات', icon: 'bi-box-seam', href: 'products.html' },
    { id: 'product-gallery', label: 'گالری محصولات', icon: 'bi-images', href: 'product-gallery.html' },
    { id: 'customers', label: 'مشتریان', icon: 'bi-people', href: 'customers.html' },
    { id: 'carts', label: 'سبدهای خرید', icon: 'bi-basket', href: 'carts.html' },
    { id: 'orders', label: 'سفارش‌ها', icon: 'bi-cart-check', href: 'orders.html' },
    { id: 'reviews', label: 'نظرات و امتیازها', icon: 'bi-chat-square-text', href: 'reviews.html' },
    { id: 'reports', label: 'گزارش‌ها', icon: 'bi-bar-chart-line', href: 'reports.html' },
    { id: 'settings', label: 'تنظیمات فروشگاه', icon: 'bi-gear', href: 'settings.html' },
    { id: 'profile', label: 'پروفایل مدیر', icon: 'bi-person-circle', href: 'profile.html' }
  ];

  const initSidebar = (activePage) => {
    const sidebar = document.querySelector('#sidebar, .sidebar, [data-sidebar]');
    if (!sidebar) return;

    const nav = sidebar.querySelector('nav, .sidebar-nav, ul') || sidebar;
    if (!nav.querySelector('[data-nav-built]')) {
      nav.innerHTML = NAV_ITEMS.map((item) => `
        <a href="${escapeHtml(item.href)}"
           class="nav-link sidebar-link ${item.id === activePage ? 'active' : ''}"
           data-page="${escapeHtml(item.id)}">
          <i class="bi ${escapeHtml(item.icon)}"></i>
          <span>${escapeHtml(item.label)}</span>
        </a>
      `).join('');
      nav.setAttribute('data-nav-built', 'true');
    } else {
      nav.querySelectorAll('[data-page]').forEach((link) => {
        link.classList.toggle('active', link.dataset.page === activePage);
      });
    }

    const toggleBtn = document.querySelector('[data-sidebar-toggle]');
    if (toggleBtn && !toggleBtn.dataset.bound) {
      toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-open');
      });
      toggleBtn.dataset.bound = 'true';
    }

    // بستن سایدبار با کلیک روی overlay (موبایل)
    document.addEventListener('click', (e) => {
      if (document.body.classList.contains('sidebar-open') &&
          !e.target.closest('.admin-sidebar') &&
          !e.target.closest('[data-sidebar-toggle]')) {
        document.body.classList.remove('sidebar-open');
      }
    });
  };

  // ─── Breadcrumb ──────────────────────────────────────────────

  const initBreadcrumb = (items = []) => {
    const el = document.querySelector('#breadcrumb, .breadcrumb, [data-breadcrumb]');
    if (!el || !items.length) return;

    el.innerHTML = items.map((item, i) => {
      const isLast = i === items.length - 1;
      if (isLast || !item.href) {
        return `<li class="breadcrumb-item active" aria-current="page">${escapeHtml(item.label)}</li>`;
      }
      return `<li class="breadcrumb-item"><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`;
    }).join('');
  };

  // ─── Toast ───────────────────────────────────────────────────

  let toastContainer = null;

  const ensureToastContainer = () => {
    if (toastContainer) return toastContainer;
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
    return toastContainer;
  };

  const TOAST_ICONS = {
    success: 'bi-check-circle-fill text-success',
    error: 'bi-x-circle-fill text-danger',
    warning: 'bi-exclamation-triangle-fill text-warning',
    info: 'bi-info-circle-fill text-info'
  };

  const showToast = (type = 'info', message = '') => {
    const container = ensureToastContainer();
    const id = `toast-${Date.now()}`;
    const icon = TOAST_ICONS[type] || TOAST_ICONS.info;

    const toastEl = document.createElement('div');
    toastEl.id = id;
    toastEl.className = 'toast align-items-center border-0 show';
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icon}"></i>
          <span>${escapeHtml(message)}</span>
        </div>
        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="بستن"></button>
      </div>
    `;
    container.appendChild(toastEl);

    const close = () => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 300);
    };

    toastEl.querySelector('.btn-close')?.addEventListener('click', close);
    setTimeout(close, 4000);
  };

  // ─── Confirm Modal ───────────────────────────────────────────

  let confirmModalEl = null;

  const ensureConfirmModal = () => {
    if (confirmModalEl) return confirmModalEl;

    confirmModalEl = document.createElement('div');
    confirmModalEl.className = 'modal fade';
    confirmModalEl.id = 'shopAdminConfirmModal';
    confirmModalEl.tabIndex = -1;
    confirmModalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" data-confirm-title></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="بستن"></button>
          </div>
          <div class="modal-body" data-confirm-message></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
            <button type="button" class="btn btn-danger" data-confirm-btn>تأیید</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(confirmModalEl);
    return confirmModalEl;
  };

  const showConfirmModal = (title, message, onConfirm) => {
    const modal = ensureConfirmModal();
    modal.querySelector('[data-confirm-title]').textContent = title;
    modal.querySelector('[data-confirm-message]').textContent = message;

    const confirmBtn = modal.querySelector('[data-confirm-btn]');
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.replaceWith(newBtn);

    newBtn.addEventListener('click', () => {
      if (typeof onConfirm === 'function') onConfirm();
      hideModal(modal);
    });

    showModal(modal);
  };

  // ─── Loading ─────────────────────────────────────────────────

  const showLoading = (el) => {
    if (!el) return;
    el.classList.add('position-relative');
    el.setAttribute('aria-busy', 'true');
    if (!el.querySelector('.shop-admin-loading')) {
      const overlay = document.createElement('div');
      overlay.className = 'shop-admin-loading position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75';
      overlay.style.zIndex = '10';
      overlay.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">در حال بارگذاری...</span></div>';
      el.appendChild(overlay);
    }
  };

  const hideLoading = (el) => {
    if (!el) return;
    el.removeAttribute('aria-busy');
    el.querySelector('.shop-admin-loading')?.remove();
  };

  // ─── Empty State ─────────────────────────────────────────────

  const renderEmptyState = (container, { icon = 'bi-inbox', title = 'موردی یافت نشد', message = '', actionLabel, onAction } = {}) => {
    if (!container) return;
    container.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi ${escapeHtml(icon)} display-4 d-block mb-3"></i>
        <h5>${escapeHtml(title)}</h5>
        ${message ? `<p class="mb-3">${escapeHtml(message)}</p>` : ''}
        ${actionLabel ? `<button type="button" class="btn btn-primary" data-empty-action>${escapeHtml(actionLabel)}</button>` : ''}
      </div>
    `;
    const btn = container.querySelector('[data-empty-action]');
    if (btn && typeof onAction === 'function') {
      btn.addEventListener('click', onAction);
    }
  };

  // ─── Searchable Dropdown ─────────────────────────────────────

  const renderSearchableDropdown = (container, options = [], value, onChange) => {
    if (!container) return;

    const selected = options.find((o) => o.value === value);
    const uid = `dropdown-${Date.now()}`;

    container.innerHTML = `
      <div class="dropdown searchable-dropdown w-100" data-dropdown-id="${uid}">
        <button class="btn btn-outline-secondary dropdown-toggle w-100 text-start" type="button"
                data-bs-toggle="dropdown" aria-expanded="false">
          ${escapeHtml(selected?.label ?? 'انتخاب کنید...')}
        </button>
        <div class="dropdown-menu w-100 p-2">
          <input type="search" class="form-control form-control-sm mb-2" placeholder="جستجو..." data-dropdown-search>
          <div class="dropdown-items" style="max-height:200px;overflow-y:auto" data-dropdown-items></div>
        </div>
      </div>
    `;

    const itemsEl = container.querySelector('[data-dropdown-items]');
    const searchEl = container.querySelector('[data-dropdown-search]');
    const toggleBtn = container.querySelector('.dropdown-toggle');

    const renderItems = (filter = '') => {
      const q = filter.trim().toLowerCase();
      const filtered = q
        ? options.filter((o) => o.label.toLowerCase().includes(q))
        : options;

      itemsEl.innerHTML = filtered.length
        ? filtered.map((o) => `
            <button type="button" class="dropdown-item ${o.value === value ? 'active' : ''}"
                    data-value="${escapeHtml(String(o.value))}">
              ${escapeHtml(o.label)}
            </button>
          `).join('')
        : '<span class="dropdown-item-text text-muted">نتیجه‌ای یافت نشد</span>';

      itemsEl.querySelectorAll('[data-value]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const val = btn.dataset.value;
          const numVal = Number(val);
          const finalVal = Number.isNaN(numVal) ? val : numVal;
          if (typeof onChange === 'function') onChange(finalVal);
          toggleBtn.textContent = btn.textContent.trim();
        });
      });
    };

    renderItems();
    searchEl?.addEventListener('input', (e) => renderItems(e.target.value));
  };

  // ─── Pagination UI ───────────────────────────────────────────

  const renderPagination = (container, page, totalPages, onPageChange) => {
    if (!container) return;
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const pages = [];
    const addPage = (p) => pages.push(p);

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) addPage(i);
    } else {
      addPage(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) addPage(i);
      if (page < totalPages - 2) pages.push('...');
      addPage(totalPages);
    }

    container.innerHTML = `
      <nav aria-label="صفحه‌بندی">
        <ul class="pagination justify-content-center mb-0">
          <li class="page-item ${page <= 1 ? 'disabled' : ''}">
            <button type="button" class="page-link" data-page="${page - 1}" aria-label="قبلی">&laquo;</button>
          </li>
          ${pages.map((p) => {
            if (p === '...') return '<li class="page-item disabled"><span class="page-link">…</span></li>';
            return `
              <li class="page-item ${p === page ? 'active' : ''}">
                <button type="button" class="page-link" data-page="${p}">${p.toLocaleString('fa-IR')}</button>
              </li>`;
          }).join('')}
          <li class="page-item ${page >= totalPages ? 'disabled' : ''}">
            <button type="button" class="page-link" data-page="${page + 1}" aria-label="بعدی">&raquo;</button>
          </li>
        </ul>
      </nav>
    `;

    container.querySelectorAll('[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = Number(btn.dataset.page);
        if (target >= 1 && target <= totalPages && target !== page) {
          if (typeof onPageChange === 'function') onPageChange(target);
        }
      });
    });
  };

  // ─── Table Sort ────────────────────────────────────────────────

  const bindTableSort = (tableEl, onSort) => {
    if (!tableEl) return;
    tableEl.querySelectorAll('th[data-sort]').forEach((th) => {
      if (th.dataset.sortBound) return;
      th.style.cursor = 'pointer';
      th.dataset.sortBound = 'true';
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        const current = th.dataset.sortDir || 'asc';
        const next = current === 'asc' ? 'desc' : 'asc';

        tableEl.querySelectorAll('th[data-sort]').forEach((h) => {
          h.dataset.sortDir = '';
          h.classList.remove('sort-asc', 'sort-desc');
        });
        th.dataset.sortDir = next;
        th.classList.add(next === 'asc' ? 'sort-asc' : 'sort-desc');

        if (typeof onSort === 'function') onSort(field, next);
      });
    });
  };

  // ─── Modal Helpers ─────────────────────────────────────────────

  const showModal = (modalEl) => {
    if (!modalEl) return;
    if (window.bootstrap?.Modal) {
      window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
    } else {
      modalEl.classList.add('show');
      modalEl.style.display = 'block';
      modalEl.removeAttribute('aria-hidden');
    }
  };

  const hideModal = (modalEl) => {
    if (!modalEl) return;
    if (window.bootstrap?.Modal) {
      const instance = window.bootstrap.Modal.getInstance(modalEl);
      if (instance) instance.hide();
    } else {
      modalEl.classList.remove('show');
      modalEl.style.display = 'none';
      modalEl.setAttribute('aria-hidden', 'true');
    }
  };

  const createModal = ({ id, title, bodyHtml, footerHtml, size = '' }) => {
    let modal = document.getElementById(id);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = id;
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog ${size ? `modal-${size}` : ''} modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${escapeHtml(title)}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="بستن"></button>
          </div>
          <div class="modal-body">${bodyHtml || ''}</div>
          ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  };

  ShopAdmin.ui = {
    initSidebar,
    initBreadcrumb,
    showToast,
    showConfirmModal,
    showLoading,
    hideLoading,
    renderEmptyState,
    renderSearchableDropdown,
    renderPagination,
    bindTableSort,
    showModal,
    hideModal,
    createModal,
    NAV_ITEMS
  };
})(window.ShopAdmin = window.ShopAdmin || {});
