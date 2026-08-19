window.Auth = (function () {
  const cfg = window.AppConfig;

  function getStorage() {
    return localStorage.getItem(cfg.tokenStorageKey) ? localStorage : sessionStorage;
  }

  function getAccessToken() {
    return localStorage.getItem(cfg.tokenStorageKey) || sessionStorage.getItem(cfg.tokenStorageKey);
  }

  function getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem(cfg.userStorageKey) || sessionStorage.getItem(cfg.userStorageKey) || "null");
    } catch {
      return null;
    }
  }

  function saveUser(user, persistent) {
    const target = persistent ? localStorage : sessionStorage;
    const other = persistent ? sessionStorage : localStorage;
    other.removeItem(cfg.userStorageKey);
    target.setItem(cfg.userStorageKey, JSON.stringify(user));
  }

  function clear() {
    [localStorage, sessionStorage].forEach((store) => {
      store.removeItem(cfg.tokenStorageKey);
      store.removeItem(cfg.userStorageKey);
    });
  }

  function normalizeUser(raw) {
    if (!raw) return null;
    return {
      userID: raw.userID || raw.userId || "",
      firstName: raw.firstName || "",
      lastName: raw.lastName || "",
      mobileNumber: raw.mobileNumber || "",
      address: raw.address || "",
      postalCode: raw.postalCode || "",
      avatarPath: raw.avatarPath || "",
      roles: Array.isArray(raw.roles) ? raw.roles : []
    };
  }

  function getCurrentUser() {
    return getStoredUser();
  }

  function isAuthenticated() {
    return Boolean(getAccessToken());
  }

  function hasRole(role) {
    const user = getCurrentUser();
    return Boolean(user && user.roles && user.roles.some((x) => String(x).toLowerCase() === role.toLowerCase()));
  }

  function displayName(user) {
    const value = user || getCurrentUser();
    if (!value) return "حساب من";
    const name = [value.firstName, value.lastName].filter(Boolean).join(" ");
    return name || value.mobileNumber || "حساب من";
  }

  async function login(model) {
    const response = await window.Api.post(cfg.endpoints.login, {
      mobileNumber: model.mobileNumber,
      password: model.password,
      rememberMe: Boolean(model.rememberMe)
    });
    const data = response.data;
    if (!data || !data.token) throw new Error("پاسخ ورود شامل Token نیست.");
    clear();
    const target = model.rememberMe ? localStorage : sessionStorage;
    target.setItem(cfg.tokenStorageKey, data.token);
    const user = normalizeUser(data);
    saveUser(user, model.rememberMe);
    return user;
  }

  async function register(model) {
    const response = await window.Api.post(cfg.endpoints.register, model);
    return response.data;
  }

  async function loadAuthenticatedUser() {
    if (!isAuthenticated()) return null;
    try {
      const response = await window.Api.get(cfg.endpoints.authenticatedUser);
      const user = normalizeUser(response.data);
      saveUser(user, getStorage() === localStorage);
      return user;
    } catch (error) {
      if (window.Api.normalizeError(error).status === 401) clear();
      return getCurrentUser();
    }
  }

  async function logout() {
    try {
      if (isAuthenticated()) await window.Api.post(cfg.endpoints.logout, {});
    } catch {
      /* local logout still continues */
    }
    clear();
    location.href = cfg.panel.visitor + "index.html";
  }

  function resolveReturnUrl(raw) {
    if (!raw || typeof raw !== "string") return null;
    const value = raw.trim();
    if (!value || value.startsWith("//")) return null;
    if (/^(javascript|data|vbscript):/i.test(value)) return null;
    try {
      const target = new URL(value, `${location.origin}/`);
      if (target.origin !== location.origin) return null;
      const path = `${target.pathname}${target.search}${target.hash}`;
      return path.startsWith("/") ? path.slice(1) : path;
    } catch {
      return null;
    }
  }

  function redirectToLogin(returnUrl, mode) {
    const q = new URLSearchParams();
    const safeReturnUrl = resolveReturnUrl(returnUrl);
    if (safeReturnUrl) q.set("returnUrl", safeReturnUrl);
    if (mode === "register") q.set("mode", "register");
    location.href = `${cfg.panel.visitor}login.html?${q.toString()}`;
  }

  function dashboardUrl(user) {
    const current = user || getCurrentUser();
    if (current && current.roles && current.roles.some((x) => String(x).toLowerCase() === "admin")) {
      return cfg.panel.admin + "index.html";
    }
    return cfg.panel.customer + "index.html";
  }

  function requireRole(role) {
    if (!isAuthenticated()) {
      redirectToLogin(location.href);
      return false;
    }
    if (!hasRole(role)) {
      location.href = dashboardUrl();
      return false;
    }
    return true;
  }

  return {
    getAccessToken,
    getCurrentUser,
    isAuthenticated,
    hasRole,
    displayName,
    login,
    register,
    loadAuthenticatedUser,
    logout,
    redirectToLogin,
    resolveReturnUrl,
    dashboardUrl,
    requireRole,
    clear
  };
})();
