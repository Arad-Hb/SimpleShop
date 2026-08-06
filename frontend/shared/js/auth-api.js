/**

 * auth-api.js — shared auth endpoints (Axios)

 */

(function (global) {

  'use strict';



  const baseUrl = (url) => String(url || global.SimpleShopApiConfig?.API_BASE_URL || '').replace(/\/$/, '');



  const getAuthClient = (apiBaseUrl, timeoutMs) => SimpleShopHttp.createClient({

    baseURL: baseUrl(apiBaseUrl),

    timeout: timeoutMs || global.SimpleShopApiConfig?.REQUEST_TIMEOUT_MS || 12000

  });



  /**

   * @param {{ apiBaseUrl?: string, username: string, password: string, role: string, timeoutMs?: number }}

   */

  const login = async ({ apiBaseUrl, username, password, role, timeoutMs }) => {

    const { request } = getAuthClient(apiBaseUrl, timeoutMs);

    return request('/api/auth/login', {

      method: 'POST',

      body: {

        username: String(username || '').trim(),

        password: String(password || ''),

        role

      }

    });

  };



  /**

   * @param {{ apiBaseUrl?: string, mobile: string, role: string, timeoutMs?: number }}

   */

  const checkMobile = async ({ apiBaseUrl, mobile, role, timeoutMs }) => {

    const { client } = getAuthClient(apiBaseUrl, timeoutMs);

    const params = new URLSearchParams({

      mobile: String(mobile || '').trim(),

      role: String(role || 'Customer')

    });

    const response = await client.get(`/api/auth/check-mobile?${params}`);

    return response.data;

  };



  const register = async ({
    apiBaseUrl,
    mobile,
    password,
    role = 'Customer',
    firstName,
    lastName,
    email,
    timeoutMs
  }) => {
    const { request } = getAuthClient(apiBaseUrl, timeoutMs);
    return request('/api/auth/register', {
      method: 'POST',
      body: {
        mobile: String(mobile || '').trim(),
        password: String(password || ''),
        role: String(role || 'Customer'),
        firstName: firstName ? String(firstName).trim() : null,
        lastName: lastName ? String(lastName).trim() : null,
        email: email ? String(email).trim() : null
      }
    });
  };

  const formatError = (err) => SimpleShopHttp.parseError(err) || 'خطا در ورود.';



  global.SimpleShopAuthApi = {

    login,

    register,

    checkMobile,

    formatError

  };

})(window);

