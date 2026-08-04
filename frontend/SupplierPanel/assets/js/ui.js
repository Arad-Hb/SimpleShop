/**
 * ui.js — سایدبار، toast، breadcrumb
 */
(function (ShopSupplier) {
  'use strict';

  const { escapeHtml } = ShopSupplier.utils;

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'داشبورد', icon: 'bi-speedometer2', href: 'index.html' },
    { id: 'products', label: 'محصولات من', icon: 'bi-box-seam', href: 'products.html' },
    { id: 'brands', label: 'برندهای من', icon: 'bi-award', href: 'brands.html' },
    { id: 'profile', label: 'پروفایل تأمین‌کننده', icon: 'bi-person-badge', href: 'profile.html' }
  ];

  const initSidebar = (activePage) => {
    const sidebar = document.querySelector('#sidebar, [data-sidebar]');
    if (!sidebar) return;

    const nav = sidebar.querySelector('.sidebar-nav') || sidebar;
    nav.innerHTML = NAV_ITEMS.map((item) => `
      <a href="${escapeHtml(item.href)}"
         class="sidebar-link ${item.id === activePage ? 'active' : ''}"
         data-page="${escapeHtml(item.id)}">
        <i class="bi ${escapeHtml(item.icon)}"></i>
        <span>${escapeHtml(item.label)}</span>
      </a>
    `).join('');

    const toggleBtn = document.querySelector('[data-sidebar-toggle]');
    if (toggleBtn && !toggleBtn.dataset.bound) {
      toggleBtn.addEventListener('click', () => document.body.classList.toggle('sidebar-open'));
      toggleBtn.dataset.bound = 'true';
    }

    document.addEventListener('click', (e) => {
      if (
        document.body.classList.contains('sidebar-open') &&
        !e.target.closest('.admin-sidebar') &&
        !e.target.closest('[data-sidebar-toggle]')
      ) {
        document.body.classList.remove('sidebar-open');
      }
    });
  };

  const initBreadcrumb = (items = []) => {
    const el = document.querySelector('[data-breadcrumb]');
    if (!el || !items.length) return;
    el.innerHTML = items.map((item, i) => {
      const last = i === items.length - 1;
      if (last || !item.href) {
        return `<li class="breadcrumb-item active" aria-current="page">${escapeHtml(item.label)}</li>`;
      }
      return `<li class="breadcrumb-item"><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`;
    }).join('');
  };

  let toastContainer = null;
  const ensureToast = () => {
    if (toastContainer) return toastContainer;
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
    return toastContainer;
  };

  const showToast = (type = 'info', message = '') => {
    const icons = {
      success: 'bi-check-circle-fill text-success',
      error: 'bi-x-circle-fill text-danger',
      warning: 'bi-exclamation-triangle-fill text-warning',
      info: 'bi-info-circle-fill text-info'
    };
    const wrap = ensureToast();
    const el = document.createElement('div');
    el.className = 'toast show align-items-center border-0 shadow';
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icons[type] || icons.info}"></i>
          <span>${escapeHtml(message)}</span>
        </div>
        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>`;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  };

  ShopSupplier.ui = { initSidebar, initBreadcrumb, showToast, NAV_ITEMS };
})(window.ShopSupplier = window.ShopSupplier || {});
