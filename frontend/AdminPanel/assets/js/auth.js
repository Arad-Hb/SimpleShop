/**
 * auth.js — احراز هویت پنل مدیریت (API + session)
 */
(function (ShopAdmin) {
  'use strict';

  const ROLE = 'Admin';
  const SESSION_KEY = 'shopAdminSession';
  const LEGACY_TOKEN_KEY = 'shopAdminApiToken';

  const buildSession = (authData, rememberMe = false) => ({
    username: authData.username || authData.mobile || '',
    mobile: authData.mobile || '',
    userId: authData.userId || '',
    role: authData.role || ROLE,
    fullName: authData.fullName || '',
    token: authData.token || '',
    loggedInAt: new Date().toISOString(),
    rememberMe,
    expiresAt: rememberMe
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
  });

  const saveSession = (session) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    if (session.rememberMe) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  };

  const getSession = () => {
    let raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
      const session = JSON.parse(raw);
      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        logout();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  };

  const getToken = () => getSession()?.token || null;

  const isAuthenticated = () => {
    const session = getSession();
    return session !== null && !!session.token;
  };

  /**
   * @returns {Promise<{ success: boolean, message?: string }>}
   */
  const login = async (username, password, rememberMe = false) => {
    const user = String(username || '').trim();
    const pass = String(password || '');

    if (!user || !pass) {
      return { success: false, message: 'نام کاربری و رمز عبور الزامی است.' };
    }

    try {
      const data = await SimpleShopAuthApi.login({
        apiBaseUrl: ShopAdmin.config?.API_BASE_URL,
        username: user,
        password: pass,
        role: ROLE,
        timeoutMs: ShopAdmin.config?.REQUEST_TIMEOUT_MS
      });

      if (!data?.token) {
        return { success: false, message: 'پاسخ سرور نامعتبر است.' };
      }

      saveSession(buildSession(data, rememberMe));
      return { success: true };
    } catch (err) {
      return { success: false, message: SimpleShopAuthApi.formatError(err) };
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  };

  const requireAuth = (loginPage = 'login.html') => {
    if (isAuthenticated()) return true;
    const current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const loginNames = new Set([
      loginPage.toLowerCase(),
      loginPage.replace(/\.html$/i, '').toLowerCase(),
      'login'
    ]);
    if (!loginNames.has(current)) {
      window.location.href = loginPage;
    }
    return false;
  };

  ShopAdmin.auth = {
    ROLE,
    login,
    logout,
    isAuthenticated,
    requireAuth,
    getSession,
    getToken
  };
})(window.ShopAdmin = window.ShopAdmin || {});
