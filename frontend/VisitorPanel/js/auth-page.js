/**
 * auth-page.js — ورود / ثبت‌نام (تب واحد)
 */
(function (Store) {
  'use strict';

  const pick = (obj, ...keys) => {
    for (const k of keys) {
      if (obj?.[k] != null && obj[k] !== '') return obj[k];
    }
    return null;
  };

  const showError = (message) => {
    const box = document.getElementById('auth-error');
    if (!box) return;
    if (!message) {
      box.classList.add('d-none');
      box.textContent = '';
      return;
    }
    box.textContent = message;
    box.classList.remove('d-none');
  };

  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    const tab = (params.get('tab') || '').toLowerCase();
    return tab === 'register' ? 'register' : 'login';
  };

  const getInitialRole = () => {
    const params = new URLSearchParams(window.location.search);
    const role = (params.get('role') || '').trim();
    return role === 'Supplier' ? 'Supplier' : 'Customer';
  };

  const setRegisterRole = (role) => {
    document.querySelectorAll('.role-switch-btn').forEach((btn) => {
      const active = btn.dataset.role === role;
      btn.classList.toggle('active', active);
    });
    const hidden = document.getElementById('register-role');
    if (hidden) hidden.value = role;
  };

  const setLoginRole = (role) => {
    const roleInput = document.getElementById('login-role');
    if (roleInput) roleInput.value = role;
  };

  const setActiveTab = (tab) => {
    document.querySelectorAll('[data-auth-tab]').forEach((btn) => {
      const active = btn.dataset.authTab === tab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-auth-pane]').forEach((pane) => {
      pane.classList.toggle('d-none', pane.dataset.authPane !== tab);
    });
    showError('');
    if (tab === 'login') {
      const roleInput = document.getElementById('login-role');
      if (roleInput) roleInput.value = 'Customer';
    }
  };

  const saveToken = (data) => {
    const token = pick(data, 'token', 'Token');
    if (token) Store.api?.setToken?.(token);
  };

  const redirectAfterAuth = (role) => {
    if (role === 'Supplier') {
      window.location.href = '../SupplierPanel/index.html';
      return;
    }
    if (role === 'Customer') {
      window.location.href = '../CustomerPanel/index.html';
      return;
    }
    window.location.href = 'index.html';
  };

  const initTabs = () => {
    const tab = getInitialTab();
    const role = getInitialRole();
    setActiveTab(tab);
    if (tab === 'register') setRegisterRole(role);
    if (tab === 'login' && role === 'Supplier') setLoginRole('Supplier');
    document.querySelectorAll('[data-auth-tab]').forEach((btn) => {
      btn.addEventListener('click', () => setActiveTab(btn.dataset.authTab));
    });
  };

  const initRoleSwitch = () => {
    document.querySelectorAll('.role-switch-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.role-switch-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const role = btn.dataset.role || 'Customer';
        const hidden = document.getElementById('register-role');
        if (hidden) hidden.value = role;
      });
    });
  };

  const initLoginForm = () => {
    const roleInput = document.getElementById('login-role');
    document.getElementById('login-as-supplier')?.addEventListener('click', () => {
      if (roleInput) roleInput.value = 'Supplier';
      showError('');
      Store.ui?.showToast?.('حالت ورود فروشنده — موبایل و رمز فروشنده را وارد کنید');
    });

    document.getElementById('login-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      showError('');

      const mobile = document.getElementById('login-mobile')?.value?.trim() || '';
      const password = document.getElementById('login-password')?.value || '';
      const role = roleInput?.value || 'Customer';

      if (!mobile || !password) {
        showError('موبایل و رمز عبور را وارد کنید.');
        return;
      }

      try {
        let data;
        if (Store.config?.USE_API && SimpleShopAuthApi) {
          data = await SimpleShopAuthApi.login({
            apiBaseUrl: Store.config.API_BASE_URL,
            username: mobile,
            password,
            role,
            timeoutMs: Store.config.REQUEST_TIMEOUT_MS
          });
        } else {
          Store.ui?.showToast?.('ورود دمو انجام شد');
          setTimeout(() => { window.location.href = 'index.html'; }, 600);
          return;
        }

        saveToken(data);
        const resolvedRole = pick(data, 'role', 'Role') || role;
        Store.ui?.showToast?.('ورود موفق');
        setTimeout(() => redirectAfterAuth(resolvedRole), 500);
      } catch (err) {
        showError(SimpleShopAuthApi?.formatError?.(err) || 'ورود ناموفق — موبایل یا رمز را بررسی کنید.');
        if (roleInput) roleInput.value = 'Customer';
      }
    });
  };

  const initRegisterForm = () => {
    document.getElementById('register-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      showError('');

      const firstName = document.getElementById('register-firstName')?.value?.trim() || '';
      const lastName = document.getElementById('register-lastName')?.value?.trim() || '';
      const mobile = document.getElementById('register-mobile')?.value?.trim() || '';
      const password = document.getElementById('register-password')?.value || '';
      const role = document.getElementById('register-role')?.value || 'Customer';

      if (!firstName || !lastName || !mobile || !password) {
        showError('لطفاً همه فیلدها را پر کنید.');
        return;
      }
      if (password.length < 6) {
        showError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
        return;
      }

      try {
        if (!Store.config?.USE_API || !SimpleShopAuthApi) {
          showError('ثبت‌نام فقط با اتصال به API امکان‌پذیر است.');
          return;
        }

        const data = await SimpleShopAuthApi.register({
          apiBaseUrl: Store.config.API_BASE_URL,
          mobile,
          password,
          role,
          firstName,
          lastName,
          timeoutMs: Store.config.REQUEST_TIMEOUT_MS
        });

        saveToken(data);
        const resolvedRole = pick(data, 'role', 'Role') || role;
        Store.ui?.showToast?.('ثبت‌نام موفق — خوش آمدید');
        setTimeout(() => redirectAfterAuth(resolvedRole), 500);
      } catch (err) {
        showError(SimpleShopAuthApi?.formatError?.(err) || 'ثبت‌نام ناموفق بود.');
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initRoleSwitch();
    initLoginForm();
    initRegisterForm();
  });
})(window.SimpleStore = window.SimpleStore || {});
