/**
 * app.js — نقطه ورود اصلی پنل مدیریت
 * بارگذاری ماژول‌ها و مقداردهی اولیه
 */
(function (ShopAdmin) {
  'use strict';

  const DEFAULT_SHOP_NAME = (window.SimpleShopSite && window.SimpleShopSite.name) || 'فروشگاه ساده تحلیل داده';

  const initApp = async () => {
    // داده‌های نمونه (فقط بار اول — قبل از initStorage)
    ShopAdmin.seed.seedDemoData();
    // ارتقای سفارش‌های نمونه برای گزارش‌های چندماهه
    if (typeof ShopAdmin.seed.ensureRichOrders === 'function') {
      ShopAdmin.seed.ensureRichOrders();
    }

    // مقداردهی ذخیره‌سازی
    ShopAdmin.storage.initStorage();

    // همگام‌سازی محصولات/دسته‌ها/تصاویر از دیتابیس API
    if (typeof ShopAdmin.sync?.syncCatalogFromApi === 'function') {
      const result = await ShopAdmin.sync.syncCatalogFromApi();
      if (result.ok && result.message !== 'cached' && ShopAdmin.ui?.showToast) {
        ShopAdmin.ui.showToast(
          'success',
          `همگام با دیتابیس: ${result.products.toLocaleString('fa-IR')} محصول`
        );
      } else if (!result.ok && result.message === 'API offline' && ShopAdmin.ui?.showToast) {
        ShopAdmin.ui.showToast('warning', 'API در دسترس نیست — داده‌های محلی نمایش داده می‌شود');
      }
      document.dispatchEvent(new CustomEvent('admin:catalog-synced', { detail: result }));
    }

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
      shopNameEl.textContent = settings?.shopName || DEFAULT_SHOP_NAME;
    }

    // نمایش نام مدیر
    const adminNameEl = document.querySelector('[data-admin-name]');
    if (adminNameEl) {
      const profile = ShopAdmin.storage.getData().adminProfile;
      adminNameEl.textContent = profile?.fullName || 'مدیر';
    }

    // Replace native <select> popups (broken / oversized in responsive DevTools)
    const runSelectEnhance = () => {
      if (typeof ShopAdmin.ui.enhanceFormSelects === 'function') {
        ShopAdmin.ui.enhanceFormSelects(document);
      }
    };
    runSelectEnhance();
    // Page scripts often populate options on the same tick — re-run once after
    setTimeout(runSelectEnhance, 0);
    document.addEventListener('admin:catalog-synced', runSelectEnhance);

    // Style any static Bootstrap modals like dynamic ones
    if (typeof ShopAdmin.ui.enhanceAdminModal === 'function') {
      document.querySelectorAll('.modal').forEach((modal) => ShopAdmin.ui.enhanceAdminModal(modal));
    }
  };

  document.addEventListener('DOMContentLoaded', initApp);

  window.ShopAdmin = ShopAdmin;
})(window.ShopAdmin = window.ShopAdmin || {});
