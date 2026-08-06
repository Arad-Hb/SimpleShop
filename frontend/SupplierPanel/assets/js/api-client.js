/**
 * api-client.js — Supplier panel API client
 */
(function (ShopSupplier) {
  'use strict';

  const onUnauthorized = () => {
    ShopSupplier.auth?.logout?.();
    if (!/login\.html$/i.test(window.location.pathname)) {
      window.location.href = 'login.html';
    }
  };

  const { request } = SimpleShopHttp.createClient({
    baseURL: ShopSupplier.config?.API_BASE_URL,
    getToken: () => ShopSupplier.auth?.getToken?.(),
    timeout: ShopSupplier.config?.REQUEST_TIMEOUT_MS,
    onUnauthorized
  });

  const mediaUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
    const base = (ShopSupplier.config?.API_BASE_URL || '').replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const getProducts = async ({ page = 1, pageSize = 100, sortBy = 'name', sortDir = 'asc' } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortBy,
      sortDir
    });
    return request(`/api/products?${params}`);
  };

  const ensureApiAuth = async () => {
    if (ShopSupplier.auth?.getToken?.()) return true;
    if (!/login\.html$/i.test(window.location.pathname)) {
      window.location.href = 'login.html';
    }
    return false;
  };

  const ping = async () => {
    try {
      await request('/api/categories');
      return true;
    } catch {
      return false;
    }
  };

  ShopSupplier.api = {
    request,
    mediaUrl,
    getProducts,
    ensureApiAuth,
    ping
  };
})(window.ShopSupplier = window.ShopSupplier || {});
