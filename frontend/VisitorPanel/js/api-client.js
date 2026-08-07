/**
 * VisitorPanel API client (Axios)
 */
(function (Store) {
  'use strict';

  const tokenKey = 'simpleShopVisitorToken';

  const getToken = () => localStorage.getItem(tokenKey);
  const setToken = (token) => {
    if (token) localStorage.setItem(tokenKey, token);
    else localStorage.removeItem(tokenKey);
  };

  const { request } = SimpleShopHttp.createClient({
    baseURL: Store.config?.API_BASE_URL,
    getToken,
    timeout: Store.config?.REQUEST_TIMEOUT_MS
  });

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

  const getCategoriesTree = () => request('/api/categories/tree');

  const getBanners = (placement) => {
    const qs = placement ? `?placement=${encodeURIComponent(placement)}` : '';
    return request(`/api/banners${qs}`);
  };

  const mediaUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
    const base = (Store.config?.API_BASE_URL || '').replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const login = async (username, password) => {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: { username, password, role: 'Customer' }
    });
    if (data?.token) setToken(data.token);
    return data;
  };

  const createOrder = (payload) =>
    request('/api/orders', { method: 'POST', body: payload });

  const guestCheckout = (payload) =>
    request('/api/orders/guest', { method: 'POST', body: payload });

  const completeCheckout = (payload) =>
    request('/api/orders/complete-checkout', { method: 'POST', body: payload });

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
    getCategoriesTree,
    getBanners,
    mediaUrl,
    login,
    createOrder,
    guestCheckout,
    completeCheckout,
    ping,
    getToken,
    setToken
  };
})(window.SimpleStore = window.SimpleStore || {});
