/**
 * auth.js — احراز هویت دمو (بدون ذخیره رمز در LocalStorage)
 */
(function (ShopAdmin) {
  'use strict';

  const DEMO_USERNAME = 'admin';
  const DEMO_PASSWORD = 'Admin@123';
  const SESSION_KEY = 'shopAdminSession';

  const buildSession = (username, rememberMe = false) => ({
    username,
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

  const isAuthenticated = () => getSession() !== null;

  /**
   * @returns {{ success: boolean, message?: string }}
   */
  const login = (username, password, rememberMe = false) => {
    const user = String(username || '').trim();
    const pass = String(password || '');

    if (user !== DEMO_USERNAME || pass !== DEMO_PASSWORD) {
      return { success: false, message: 'نام کاربری یا رمز عبور اشتباه است.' };
    }

    saveSession(buildSession(user, rememberMe));
    return { success: true };
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  };

  /** هدایت به صفحه ورود در صورت عدم احراز هویت */
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
    DEMO_USERNAME,
    DEMO_PASSWORD,
    login,
    logout,
    isAuthenticated,
    requireAuth,
    getSession
  };
})(window.ShopAdmin = window.ShopAdmin || {});
