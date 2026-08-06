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

  const { request } = SimpleShopHttp.createClient({
    baseURL: ShopCustomer.config?.API_BASE_URL,
    getToken: () => ShopCustomer.auth?.getToken?.(),
    timeout: ShopCustomer.config?.REQUEST_TIMEOUT_MS,
    onUnauthorized
  });

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
    searchOrders,
    getOrder,
    ensureApiAuth
  };
})(window.ShopCustomer = window.ShopCustomer || {});
