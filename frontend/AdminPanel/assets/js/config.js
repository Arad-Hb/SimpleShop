/**
 * config.js — تنظیمات اتصال Admin به API
 */
(function (ShopAdmin) {
  'use strict';

  ShopAdmin.config = {
    API_BASE_URL: 'http://localhost:5102',
    /** همگام‌سازی خودکار کاتالوگ از دیتابیس هنگام بارگذاری پنل */
    SYNC_FROM_API: true,
    REQUEST_TIMEOUT_MS: 12000,
    /** نسخه همگام‌سازی — با افزایش، کاتالوگ دوباره از API کشیده می‌شود */
    SYNC_VERSION: 3
  };
})(window.ShopAdmin = window.ShopAdmin || {});
