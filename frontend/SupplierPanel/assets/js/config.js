/**
 * config.js — تنظیمات پنل تأمین‌کننده
 */
(function (ShopSupplier) {
  'use strict';

  const shared = window.SimpleShopApiConfig || {};

  ShopSupplier.config = {
    API_BASE_URL: shared.API_BASE_URL || 'http://localhost:5102',
    REQUEST_TIMEOUT_MS: shared.REQUEST_TIMEOUT_MS || 12000
  };
})(window.ShopSupplier = window.ShopSupplier || {});
