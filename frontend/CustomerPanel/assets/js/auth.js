/**

 * auth.js — احراز هویت پنل مشتری (API + session)

 */

(function (ShopCustomer) {

  'use strict';



  const ROLE = 'Customer';

  const SESSION_KEY = 'shopCustomerSession';



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

      return { success: false, message: 'شماره موبایل و رمز عبور الزامی است.' };

    }



    try {

      const data = await SimpleShopAuthApi.login({

        apiBaseUrl: ShopCustomer.config?.API_BASE_URL,

        username: user,

        password: pass,

        role: ROLE,

        timeoutMs: ShopCustomer.config?.REQUEST_TIMEOUT_MS

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



  const register = async ({ firstName, lastName, username, email, mobile, password }) => {
    const fname = String(firstName || '').trim();
    const lname = String(lastName || '').trim();
    const mail = String(email || '').trim();
    const mob = String(mobile || '').trim();
    const pass = String(password || '');

    if (!fname || !lname || !mail || !mob || !pass) {
      return { success: false, message: 'لطفاً همه فیلدهای الزامی را پر کنید.' };
    }
    if (pass.length < 6) {
      return { success: false, message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' };
    }

    try {
      await SimpleShopAuthApi.register({
        apiBaseUrl: ShopCustomer.config?.API_BASE_URL,
        mobile: mob,
        password: pass,
        role: ROLE,
        firstName: fname,
        lastName: lname,
        email: mail,
        timeoutMs: ShopCustomer.config?.REQUEST_TIMEOUT_MS
      });
      return { success: true, message: 'ثبت‌نام انجام شد. اکنون وارد شوید.' };
    } catch (err) {
      return { success: false, message: SimpleShopAuthApi.formatError(err) };
    }
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

      'login',

      'register',

      'register.html'

    ]);

    if (!loginNames.has(current)) window.location.href = loginPage;

    return false;

  };



  ShopCustomer.auth = {

    ROLE,

    SESSION_KEY,

    login,

    register,

    logout,

    getSession,

    getToken,

    isAuthenticated,

    requireAuth

  };

})(window.ShopCustomer = window.ShopCustomer || {});

