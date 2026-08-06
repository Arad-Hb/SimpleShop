/**
 * api-config.js — shared API base URL for all SimpleShop panels
 *
 * Script load order:
 * 1. axios.min.js
 * 2. http-client.js
 * 3. api-config.js (this file)
 * 4. panel config.js / auth-api.js / api-client.js
 */
(function (global) {
  'use strict';

  global.SimpleShopApiConfig = {
    API_BASE_URL: 'http://localhost:5102',
    REQUEST_TIMEOUT_MS: 12000
  };
})(window);
