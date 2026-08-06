/**
 * config.js — تنظیمات اتصال Admin به API
 */
(function (ShopAdmin) {
  'use strict';

  const shared = window.SimpleShopApiConfig || {};

  ShopAdmin.config = {
    API_BASE_URL: shared.API_BASE_URL || 'http://localhost:5102',
    REQUEST_TIMEOUT_MS: shared.REQUEST_TIMEOUT_MS || 12000,
    /** همگام‌سازی خودکار کاتالوگ از دیتابیس هنگام بارگذاری پنل */
    SYNC_FROM_API: true,
    /** نسخه همگام‌سازی — با افزایش، کاتالوگ دوباره از API کشیده می‌شود */
    SYNC_VERSION: 3
  };
})(window.ShopAdmin = window.ShopAdmin || {});
