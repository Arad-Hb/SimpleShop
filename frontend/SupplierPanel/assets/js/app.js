/**
 * app.js — نقطه ورود پنل تأمین‌کننده
 */
(function (ShopSupplier) {
  'use strict';

  const initApp = () => {
    ShopSupplier.seed.seedDemoData();

    const activePage = document.body.dataset.page;
    if (activePage) ShopSupplier.ui.initSidebar(activePage);

    document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        ShopSupplier.auth.logout();
        window.location.href = 'login.html';
      });
      btn.dataset.bound = 'true';
    });

    const companyEl = document.querySelector('[data-company-name]');
    if (companyEl) {
      const profile = ShopSupplier.storage.getProfile();
      companyEl.textContent = profile?.companyName || 'پنل تأمین‌کننده';
    }

    const userEl = document.querySelector('[data-supplier-name]');
    if (userEl) {
      const profile = ShopSupplier.storage.getProfile();
      userEl.textContent = profile?.contactPerson || 'تأمین‌کننده';
    }
  };

  document.addEventListener('DOMContentLoaded', initApp);
  window.ShopSupplier = ShopSupplier;
})(window.ShopSupplier = window.ShopSupplier || {});
