/**
 * config.js — تنظیمات پنل مشتری
 */
(function (ShopCustomer) {
  'use strict';

  const shared = window.SimpleShopApiConfig || {};

  ShopCustomer.config = {
    API_BASE_URL: shared.API_BASE_URL || 'http://localhost:5102',
    REQUEST_TIMEOUT_MS: shared.REQUEST_TIMEOUT_MS || 12000
  };
})(window.ShopCustomer = window.ShopCustomer || {});
