/**
 * http-client.js — Axios wrapper for all SimpleShop frontend API calls
 * Requires: shared/vendor/axios.min.js loaded first
 */
(function (global) {
  'use strict';

  const requireAxios = () => {
    if (!global.axios) {
      throw new Error('Axios is required. Load shared/vendor/axios.min.js before http-client.js.');
    }
    return global.axios;
  };

  const parseError = (err) => {
    const axiosLib = global.axios;
    if (axiosLib?.isAxiosError?.(err)) {
      const data = err.response?.data;
      if (typeof data === 'string' && data.trim()) return data;
      if (data && typeof data === 'object') {
        if (data.message) return data.message;
        if (data.title) return data.title;
      }
      const status = err.response?.status;
      if (status) return `خطای سرور (${status})`;
    }
    if (err?.code === 'ECONNABORTED') return 'زمان اتصال به سرور به پایان رسید.';
    return err?.message || 'خطا در ارتباط با سرور.';
  };

  /**
   * @param {{ baseURL?: string, getToken?: () => (string|null|undefined), timeout?: number, onUnauthorized?: () => void }}
   */
  const createClient = ({ baseURL, getToken, timeout, onUnauthorized }) => {
    const axiosLib = requireAxios();
    const client = axiosLib.create({
      baseURL: String(baseURL || global.SimpleShopApiConfig?.API_BASE_URL || '').replace(/\/$/, ''),
      timeout: timeout ?? global.SimpleShopApiConfig?.REQUEST_TIMEOUT_MS ?? 12000,
      headers: { Accept: 'application/json' }
    });

    client.interceptors.request.use((config) => {
      const token = getToken?.();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && typeof onUnauthorized === 'function') {
          onUnauthorized();
        }
        return Promise.reject(error);
      }
    );

    /**
     * @param {string} path
     * @param {{ method?: string, body?: unknown, headers?: Record<string,string> }} [options]
     */
    const request = async (path, options = {}) => {
      const url = path.startsWith('/') ? path : `/${path}`;
      const method = String(options.method || 'GET').toUpperCase();
      const config = {
        url,
        method,
        headers: { ...(options.headers || {}) }
      };

      if (options.body !== undefined && options.body !== null) {
        config.data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        config.headers['Content-Type'] = 'application/json';
      }

      const response = await client.request(config);
      return response.status === 204 ? null : response.data;
    };

    return { client, request };
  };

  global.SimpleShopHttp = {
    createClient,
    parseError,
    requireAxios
  };
})(window);
