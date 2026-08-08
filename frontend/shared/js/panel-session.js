/**
 * panel-session.js — persist Customer/Supplier panel sessions after Visitor auth
 */
(function (global) {
  'use strict';

  const SESSION_KEYS = {
    Customer: 'shopCustomerSession',
    Supplier: 'shopSupplierSession'
  };

  const normalizeAuthData = (data) => ({
    username: data?.username || data?.Username || data?.mobile || data?.Mobile || '',
    mobile: data?.mobile || data?.Mobile || '',
    userId: data?.userId || data?.UserId || '',
    role: data?.role || data?.Role || '',
    fullName: data?.fullName || data?.FullName || '',
    token: data?.token || data?.Token || ''
  });

  const buildSession = (authData, rememberMe = false) => {
    const auth = normalizeAuthData(authData);
    return {
      username: auth.username,
      mobile: auth.mobile,
      userId: auth.userId,
      role: auth.role,
      fullName: auth.fullName,
      token: auth.token,
      loggedInAt: new Date().toISOString(),
      rememberMe,
      expiresAt: rememberMe
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    };
  };

  const savePanelSession = (role, authData, rememberMe = false) => {
    const key = SESSION_KEYS[role];
    const auth = normalizeAuthData(authData);
    if (!key || !auth.token) return false;

    const session = buildSession(auth, rememberMe);
    sessionStorage.setItem(key, JSON.stringify(session));
    if (rememberMe) localStorage.setItem(key, JSON.stringify(session));
    else localStorage.removeItem(key);
    return true;
  };

  const readSessionRaw = (key) => {
    if (!key) return null;
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw);
      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  };

  const getPanelSession = (role) => readSessionRaw(SESSION_KEYS[role]);

  const getActivePanelSession = () => {
    const sessions = Object.keys(SESSION_KEYS)
      .map((role) => getPanelSession(role))
      .filter(Boolean);
    if (!sessions.length) return null;
    sessions.sort((a, b) => new Date(b.loggedInAt || 0) - new Date(a.loggedInAt || 0));
    return sessions[0];
  };

  const updatePanelSession = (role, updates = {}) => {
    const key = SESSION_KEYS[role];
    const current = getPanelSession(role);
    if (!key || !current) return null;
    const next = { ...current, ...updates };
    sessionStorage.setItem(key, JSON.stringify(next));
    if (current.rememberMe) localStorage.setItem(key, JSON.stringify(next));
    return next;
  };

  const clearPanelSession = (role) => {
    const key = SESSION_KEYS[role];
    if (!key) return;
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  };

  const clearAllPanelSessions = () => {
    Object.values(SESSION_KEYS).forEach((key) => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
  };

  global.SimpleShopPanelSession = {
    SESSION_KEYS,
    buildSession,
    savePanelSession,
    normalizeAuthData,
    getPanelSession,
    getActivePanelSession,
    updatePanelSession,
    clearPanelSession,
    clearAllPanelSessions
  };
})(window);
