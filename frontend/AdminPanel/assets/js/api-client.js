/**
 * api-client.js — Admin panel API client (Axios)
 */
(function (ShopAdmin) {
  'use strict';

  const LEGACY_TOKEN_KEY = 'shopAdminApiToken';

  const getToken = () => ShopAdmin.auth?.getToken?.() || localStorage.getItem(LEGACY_TOKEN_KEY);

  const setToken = (token) => {
    if (token) localStorage.setItem(LEGACY_TOKEN_KEY, token);
    else localStorage.removeItem(LEGACY_TOKEN_KEY);
  };

  const onUnauthorized = () => {
    ShopAdmin.auth?.logout?.();
    if (!/login\.html$/i.test(window.location.pathname)) {
      window.location.href = 'login.html';
    }
  };

  const { request, client } = SimpleShopHttp.createClient({
    baseURL: ShopAdmin.config?.API_BASE_URL,
    getToken,
    timeout: ShopAdmin.config?.REQUEST_TIMEOUT_MS,
    onUnauthorized
  });

  const mediaUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
    const base = (ShopAdmin.config?.API_BASE_URL || '').replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const getProducts = async ({
    page = 1,
    pageSize = 100,
    sortBy = 'name',
    sortDir = 'asc',
    search = '',
    categoryId = undefined,
    supplierId = undefined,
    minPrice = undefined,
    maxPrice = undefined,
    isActive = undefined
  } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortBy,
      sortDir
    });
    if (search) params.set('search', search);
    if (categoryId != null && categoryId !== '') params.set('categoryId', String(categoryId));
    if (supplierId != null && supplierId !== '') params.set('supplierId', String(supplierId));
    if (minPrice != null && minPrice !== '') params.set('minPrice', String(minPrice));
    if (maxPrice != null && maxPrice !== '') params.set('maxPrice', String(maxPrice));
    if (isActive === true) params.set('isActive', 'true');
    else if (isActive === false) params.set('isActive', 'false');
    return request(`/api/products?${params}`);
  };

  const getProduct = (id) => request(`/api/products/${id}`);

  const createProduct = (body) => request('/api/products', { method: 'POST', body });

  const updateProduct = (id, body) => request(`/api/products/${id}`, { method: 'PUT', body });

  const deleteProduct = (id) => request(`/api/products/${id}`, { method: 'DELETE' });

  const getCategories = () => request('/api/categories');

  const getCategoriesTree = () => request('/api/categories/tree');

  const getCategory = (id) => request(`/api/categories/${id}`);

  const searchCategories = async ({
    pageIndex = 0,
    pageSize = 10,
    search = '',
    isActive = undefined,
    parentId = undefined
  } = {}) => {
    const params = new URLSearchParams({
      pageIndex: String(pageIndex),
      pageSize: String(pageSize)
    });
    if (search) params.set('search', search);
    if (isActive === true) params.set('isActive', 'true');
    else if (isActive === false) params.set('isActive', 'false');
    if (parentId != null && parentId !== '') params.set('parentId', String(parentId));
    return request(`/api/categories/search?${params}`);
  };

  const uploadFile = async (file, folder = 'categories') => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    const response = await client.post('/api/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.status === 204 ? null : response.data;
  };

  const createCategory = (body) => request('/api/categories', { method: 'POST', body });

  const updateCategory = (id, body) => request(`/api/categories/${id}`, { method: 'PUT', body });

  const deleteCategory = (id) => request(`/api/categories/${id}`, { method: 'DELETE' });

  const isSortOrderConflict = (err) => err?.response?.status === 409;

  const getSortOrderConflict = (err) => {
    const data = err?.response?.data;
    if (!data || typeof data !== 'object') return null;
    return {
      requiresConfirmation: data.requiresConfirmation ?? data.RequiresConfirmation ?? true,
      message: data.message ?? data.Message ?? '',
      requestedSortOrder: data.requestedSortOrder ?? data.RequestedSortOrder,
      autoSortOrder: data.autoSortOrder ?? data.AutoSortOrder
    };
  };

  const searchOrders = async ({ pageIndex = 0, pageSize = 20, status = '', userId = '' } = {}) => {
    const params = new URLSearchParams({
      pageIndex: String(pageIndex),
      pageSize: String(pageSize)
    });
    if (status) params.set('status', status);
    if (userId) params.set('userId', userId);
    return request(`/api/orders?${params}`);
  };

  const getOrder = (id) => request(`/api/orders/${id}`);

  const updateOrderStatus = (id, status) =>
    request(`/api/orders/${id}/status`, { method: 'PUT', body: { status } });

  const searchSuppliers = async ({ pageIndex = 0, pageSize = 100, search = '' } = {}) => {
    const params = new URLSearchParams({
      pageIndex: String(pageIndex),
      pageSize: String(pageSize)
    });
    if (search) params.set('search', search);
    return request(`/api/suppliers?${params}`);
  };

  const getSuppliers = () => searchSuppliers({ pageIndex: 0, pageSize: 100 });

  const getSupplier = (id) => request(`/api/suppliers/${id}`);

  const createSupplier = (body) => request('/api/suppliers', { method: 'POST', body });

  const updateSupplier = (id, body) => request(`/api/suppliers/${id}`, { method: 'PUT', body });

  const deleteSupplier = (id) => request(`/api/suppliers/${id}`, { method: 'DELETE' });

  const searchCustomers = async ({ pageIndex = 0, pageSize = 20, search = '' } = {}) => {
    const params = new URLSearchParams({
      pageIndex: String(pageIndex),
      pageSize: String(pageSize)
    });
    if (search) params.set('search', search);
    return request(`/api/customers?${params}`);
  };

  const getCustomer = (id) => request(`/api/customers/${encodeURIComponent(id)}`);

  const createCustomer = (body) => request('/api/customers', { method: 'POST', body });

  const updateCustomer = (id, body) =>
    request(`/api/customers/${encodeURIComponent(id)}`, { method: 'PUT', body });

  const deleteCustomer = (id) =>
    request(`/api/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });

  const ensureApiAuth = async () => {
    if (getToken()) return true;
    if (!/login\.html$/i.test(window.location.pathname)) {
      window.location.href = 'login.html';
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
    createProduct,
    updateProduct,
    deleteProduct,
    getCategories,
    getCategoriesTree,
    getCategory,
    searchCategories,
    uploadFile,
    createCategory,
    updateCategory,
    deleteCategory,
    isSortOrderConflict,
    getSortOrderConflict,
    searchOrders,
    getOrder,
    updateOrderStatus,
    searchSuppliers,
    getSuppliers,
    getSupplier,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    searchCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getSalesReport,
    ensureApiAuth,
    ping,
    getToken,
    setToken
  };
})(window.ShopAdmin = window.ShopAdmin || {});
