/**
 * api-client.js — Customer panel API client
 */
(function (ShopCustomer) {
  'use strict';

  const onUnauthorized = () => {
    ShopCustomer.auth?.logout?.();
    if (!/login\.html$/i.test(window.location.pathname)) {
      window.location.href = 'login.html';
    }
  };

  const { request, client } = SimpleShopHttp.createClient({
    baseURL: ShopCustomer.config?.API_BASE_URL,
    getToken: () => ShopCustomer.auth?.getToken?.(),
    timeout: ShopCustomer.config?.REQUEST_TIMEOUT_MS,
    onUnauthorized
  });

  const mediaUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
    const base = (ShopCustomer.config?.API_BASE_URL || '').replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const uploadFile = async (file, folder = 'users') => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    const response = await client.post('/api/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.status === 204 ? null : response.data;
  };

  const getMyProfile = () => request('/api/auth/me');

  const updateMyProfile = (body) => request('/api/auth/me', { method: 'PUT', body });

  const searchOrders = async ({ pageIndex = 0, pageSize = 20, status = '' } = {}) => {
    const params = new URLSearchParams({
      pageIndex: String(pageIndex),
      pageSize: String(pageSize)
    });
    if (status) params.set('status', status);
    return request(`/api/orders?${params}`);
  };

  const getOrder = (id) => request(`/api/orders/${id}`);

  const ensureApiAuth = async () => {
    if (ShopCustomer.auth?.getToken?.()) return true;
    if (!/login\.html$/i.test(window.location.pathname)) {
      window.location.href = 'login.html';
    }
    return false;
  };

  ShopCustomer.api = {
    request,
    mediaUrl,
    uploadFile,
    getMyProfile,
    updateMyProfile,
    searchOrders,
    getOrder,
    ensureApiAuth
  };
})(window.ShopCustomer = window.ShopCustomer || {});
