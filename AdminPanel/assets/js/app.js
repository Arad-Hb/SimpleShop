/**
 * app.js — نقطه ورود اصلی پنل مدیریت
 * بارگذاری ماژول‌ها و مقداردهی اولیه
 */
(function (ShopAdmin) {
  'use strict';

  const initApp = () => {
    // داده‌های نمونه (فقط بار اول — قبل از initStorage)
    ShopAdmin.seed.seedDemoData();

    // مقداردهی ذخیره‌سازی
    ShopAdmin.storage.initStorage();

    // سایدبار — اگر data-page روی body تعریف شده باشد
    const activePage = document.body.dataset.page;
    if (activePage) {
      ShopAdmin.ui.initSidebar(activePage);
    }

    // خروج از سیستم
    document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        ShopAdmin.auth.logout();
        window.location.href = 'login.html';
      });
      btn.dataset.bound = 'true';
    });

    // نمایش نام فروشگاه در هدر
    const shopNameEl = document.querySelector('[data-shop-name]');
    if (shopNameEl) {
      const settings = ShopAdmin.storage.getData().settings;
      shopNameEl.textContent = settings?.shopName || 'فروشگاه';
    }

    // نمایش نام مدیر
    const adminNameEl = document.querySelector('[data-admin-name]');
    if (adminNameEl) {
      const profile = ShopAdmin.storage.getData().adminProfile;
      adminNameEl.textContent = profile?.fullName || 'مدیر';
    }
  };

  document.addEventListener('DOMContentLoaded', initApp);

  // صادرات نهایی — همه ماژول‌ها از قبل به ShopAdmin متصل شده‌اند
  window.ShopAdmin = ShopAdmin;
})(window.ShopAdmin = window.ShopAdmin || {});
