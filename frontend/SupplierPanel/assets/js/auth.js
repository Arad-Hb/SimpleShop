/**
 * auth.js — ورود دمو تأمین‌کننده (رمز در LocalStorage ذخیره نمی‌شود)
 */
(function (ShopSupplier) {
  'use strict';

  const DEMO_USERNAME = 'supplier';
  const DEMO_PASSWORD = 'Supplier@123';
  const SESSION_KEY = 'shopSupplierSession';

  const buildSession = (username, rememberMe = false) => ({
    username,
    role: 'Supplier',
    loggedInAt: new Date().toISOString(),
    rememberMe,
    expiresAt: rememberMe
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
  });

  const saveSession = (session) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    if (session.rememberMe) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  };

  const getSession = () => {
    let raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
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

  const requireAuth = (loginPage = 'login.html') => {
    if (isAuthenticated()) return true;
    const current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const loginNames = new Set([
      loginPage.toLowerCase(),
      loginPage.replace(/\.html$/i, '').toLowerCase(),
      'login'
    ]);
    if (!loginNames.has(current)) window.location.href = loginPage;
    return false;
  };

  ShopSupplier.auth = {
    DEMO_USERNAME,
    DEMO_PASSWORD,
    login,
    logout,
    getSession,
    isAuthenticated,
    requireAuth
  };
})(window.ShopSupplier = window.ShopSupplier || {});
