/**
 * visitor-auth.js — session state for Customer/Supplier on the storefront header
 */
(function (Store) {
  'use strict';

  const PROFILE_PATHS = {
    Customer: '../CustomerPanel/profile.html',
    Supplier: '../SupplierPanel/index.html'
  };

  const getSession = () => SimpleShopPanelSession?.getActivePanelSession?.() || null;

  const getProfileHref = (role) => PROFILE_PATHS[role] || 'auth.html';

  const syncApiToken = (session) => {
    if (session?.token) Store.api?.setToken?.(session.token);
  };

  const logout = () => {
    SimpleShopPanelSession?.clearAllPanelSessions?.();
    Store.api?.setToken?.(null);
    if (typeof Store.layout?.refreshHeaderAuth === 'function') {
      Store.layout.refreshHeaderAuth();
    }
  };

  const pick = (obj, ...keys) => {
    for (const k of keys) {
      if (obj?.[k] != null && obj[k] !== '') return obj[k];
    }
    return null;
  };

  const displayName = (session) => {
    const name = (session?.fullName || '').trim();
    if (name) return name;
    return (session?.mobile || session?.username || '').trim() || 'حساب من';
  };

  const avatarSrc = (session) => {
    const url = session?.avatarThumbnailUrl || session?.avatarUrl;
    if (!url) return '';
    return Store.api?.mediaUrl ? Store.api.mediaUrl(url) : url;
  };

  const enrichSessionProfile = async (session) => {
    if (!session?.token || typeof Store.api?.getMyProfile !== 'function') return session;
    if (session.avatarThumbnailUrl || session.avatarUrl) return session;

    syncApiToken(session);
    try {
      const profile = await Store.api.getMyProfile();
      const fullName = (pick(profile, 'fullName', 'FullName') || '').trim()
        || `${pick(profile, 'firstName', 'FirstName') || ''} ${pick(profile, 'lastName', 'LastName') || ''}`.trim();
      return SimpleShopPanelSession.updatePanelSession(session.role, {
        fullName: fullName || session.fullName,
        avatarUrl: pick(profile, 'avatarUrl', 'AvatarUrl'),
        avatarThumbnailUrl: pick(profile, 'avatarThumbnailUrl', 'AvatarThumbnailUrl')
      }) || session;
    } catch {
      return session;
    }
  };

  Store.visitorAuth = {
    getSession,
    getProfileHref,
    displayName,
    avatarSrc,
    logout,
    syncApiToken,
    enrichSessionProfile
  };
})(window.SimpleStore = window.SimpleStore || {});
