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

  global.SimpleShopPanelSession = {
    SESSION_KEYS,
    buildSession,
    savePanelSession,
    normalizeAuthData
  };
})(window);
