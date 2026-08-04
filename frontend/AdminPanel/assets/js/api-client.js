/**
 * api-client.js — کلاینت سبک برای SimpleShop.Api
 */
(function (ShopAdmin) {
  'use strict';

  const TOKEN_KEY = 'shopAdminApiToken';

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const setToken = (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  };

  const mediaUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
    const base = (ShopAdmin.config?.API_BASE_URL || '').replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const request = async (path, options = {}) => {
    const base = (ShopAdmin.config?.API_BASE_URL || '').replace(/\/$/, '');
    const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      ShopAdmin.config?.REQUEST_TIMEOUT_MS || 12000
    );

    try {
      const res = await fetch(url, { ...options, headers, signal: controller.signal });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const err = new Error(text || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      if (res.status === 204) return null;
      return res.json();
    } finally {
      clearTimeout(timeout);
    }
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

  const getProduct = (id) => request(`/api/products/${id}`);

  const getCategories = () => request('/api/categories');

  const getSuppliers = async () => {
    const params = new URLSearchParams({ pageIndex: '0', pageSize: '100' });
    return request(`/api/suppliers?${params}`);
  };

  /** Try API admin login so supplier sync / future writes work. */
  const ensureApiAuth = async () => {
    if (getToken()) return true;
    try {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'admin', password: 'Admin123!' })
      });
      if (data?.token) {
        setToken(data.token);
        return true;
      }
    } catch {
      // anonymous endpoints still work
    }
    return false;
  };

  const ping = async () => {
    try {
      await getCategories();
      return true;
    } catch {
      return false;
    }
  };

  const getSalesReport = () => request('/api/reports/sales');

  ShopAdmin.api = {
    request,
    mediaUrl,
    getProducts,
    getProduct,
    getCategories,
    getSuppliers,
    getSalesReport,
    ensureApiAuth,
    ping,
    getToken,
    setToken
  };
})(window.ShopAdmin = window.ShopAdmin || {});
