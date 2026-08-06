/**
 * app.js — نقطه ورود پنل مشتری
 */
(function (ShopCustomer) {
  'use strict';

  const initApp = () => {
    const page = document.body.dataset.page;
    const isAuthPage = page === 'login' || page === 'register';

    if (!isAuthPage) {
      ShopCustomer.seed.seedDemoData();
    }

    if (page && !isAuthPage) {
      ShopCustomer.ui.initSidebar(page);
    }

    document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        ShopCustomer.auth.logout();
        window.location.href = 'login.html';
      });
      btn.dataset.bound = 'true';
    });

    const brandEl = document.querySelector('[data-customer-brand]');
    if (brandEl) {
      const profile = ShopCustomer.storage.getProfile();
      brandEl.textContent = ShopCustomer.utils.fullName(profile);
    }

    const userEl = document.querySelector('[data-customer-name]');
    if (userEl) {
      const profile = ShopCustomer.storage.getProfile();
      userEl.textContent = ShopCustomer.utils.fullName(profile);
    }

    if (typeof ShopCustomer.ui.enhanceFormSelects === 'function') {
      ShopCustomer.ui.enhanceFormSelects(document);
      setTimeout(() => ShopCustomer.ui.enhanceFormSelects(document), 0);
    }

    document.querySelectorAll('.modal').forEach((modal) => {
      ShopCustomer.ui.enhanceAdminModal?.(modal);
    });
  };

  document.addEventListener('DOMContentLoaded', initApp);
  window.ShopCustomer = ShopCustomer;
})(window.ShopCustomer = window.ShopCustomer || {});
