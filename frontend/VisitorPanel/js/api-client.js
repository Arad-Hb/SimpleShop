/**
 * Thin fetch client for SimpleShop API
 */
(function (Store) {
  'use strict';

  const tokenKey = 'simpleShopVisitorToken';

  const getToken = () => localStorage.getItem(tokenKey);
  const setToken = (token) => {
    if (token) localStorage.setItem(tokenKey, token);
    else localStorage.removeItem(tokenKey);
  };

  const request = async (path, options = {}) => {
    const base = (Store.config?.API_BASE_URL || '').replace(/\/$/, '');
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
      Store.config?.REQUEST_TIMEOUT_MS || 8000
    );

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
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

  const getProducts = (query = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, v);
    });
    const qs = params.toString();
    return request(`/api/products${qs ? `?${qs}` : ''}`);
  };

  const getProduct = (id) => request(`/api/products/${id}`);

  const getCategories = () => request('/api/categories');

  const getBanners = (placement) => {
    const qs = placement ? `?placement=${encodeURIComponent(placement)}` : '';
    return request(`/api/banners${qs}`);
  };

  /** Resolve API-relative media paths to absolute URLs */
  const mediaUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
    const base = (Store.config?.API_BASE_URL || '').replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const login = async (username, password) => {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (data?.token) setToken(data.token);
    return data;
  };

  const ping = async () => {
    try {
      await getCategories();
      return true;
    } catch {
      return false;
    }
  };

  Store.api = {
    request,
    getProducts,
    getProduct,
    getCategories,
    getBanners,
    mediaUrl,
    login,
    ping,
    getToken,
    setToken
  };
})(window.SimpleStore = window.SimpleStore || {});
