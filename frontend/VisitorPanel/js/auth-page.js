/**
 * auth-page.js — ورود / ثبت‌نام (تب واحد، استایل login پنل ادمین)
 */
(function (Store) {
  'use strict';

  let supplierLoginMode = false;

  const pick = (obj, ...keys) => {
    for (const k of keys) {
      if (obj?.[k] != null && obj[k] !== '') return obj[k];
    }
    return null;
  };

  const showHint = (message) => {
    const box = document.getElementById('auth-hint');
    if (!box) return;
    if (!message) {
      box.classList.add('d-none');
      box.textContent = '';
      return;
    }
    box.textContent = message;
    box.classList.remove('d-none');
  };

  const showError = (message) => {
    showHint('');
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

  const setSubmitLoading = (button, loading) => {
    if (!button) return;
    const text = button.querySelector('.submit-text');
    const spinner = button.querySelector('.submit-loading');
    button.disabled = loading;
    text?.classList.toggle('d-none', loading);
    spinner?.classList.toggle('d-none', !loading);
  };

  const initPasswordToggle = (inputId, buttonId, iconId) => {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    const icon = document.getElementById(iconId);
    if (!input || !button) return;

    button.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(isHidden));
      button.setAttribute('aria-label', isHidden ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور');
      if (icon) icon.className = isHidden ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill';
    });
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
    supplierLoginMode = role === 'Supplier';
  };

  const setActiveTab = (tab, options = {}) => {
    const { preserveLoginRole = false } = options;
    document.querySelectorAll('[data-auth-tab]').forEach((btn) => {
      const active = btn.dataset.authTab === tab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-auth-pane]').forEach((pane) => {
      pane.classList.toggle('d-none', pane.dataset.authPane !== tab);
    });
    showError('');
    showHint('');
    if (tab === 'login' && !preserveLoginRole && !supplierLoginMode) {
      setLoginRole('Customer');
    }
  };

  const saveAuthResult = (data, role) => {
    const token = pick(data, 'token', 'Token');
    if (token) Store.api?.setToken?.(token);
    if (SimpleShopPanelSession?.savePanelSession) {
      SimpleShopPanelSession.savePanelSession(role, data, false);
    }
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
    if (tab === 'login' && role === 'Supplier') supplierLoginMode = true;
    setActiveTab(tab, { preserveLoginRole: true });
    if (tab === 'register') setRegisterRole(role);
    if (tab === 'login' && role === 'Supplier') {
      setLoginRole('Supplier');
      showHint('حالت ورود فروشنده — موبایل و رمز فروشنده را وارد کنید.');
    }
    document.querySelectorAll('[data-auth-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.authTab === 'login') supplierLoginMode = false;
        setActiveTab(btn.dataset.authTab);
      });
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
    const submitBtn = document.getElementById('login-submit');

    document.getElementById('login-as-supplier')?.addEventListener('click', () => {
      setLoginRole('Supplier');
      showError('');
      showHint('حالت ورود فروشنده — موبایل و رمز فروشنده را وارد کنید.');
    });

    document.getElementById('login-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      showError('');
      showHint('');

      const mobile = document.getElementById('login-mobile')?.value?.trim() || '';
      const password = document.getElementById('login-password')?.value || '';
      const role = roleInput?.value || 'Customer';

      if (!mobile || !password) {
        showError('موبایل و رمز عبور را وارد کنید.');
        return;
      }

      setSubmitLoading(submitBtn, true);

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
          showError('اتصال به API برقرار نیست.');
          return;
        }

        const resolvedRole = pick(data, 'role', 'Role') || role;
        saveAuthResult(data, resolvedRole);
        setTimeout(() => redirectAfterAuth(resolvedRole), 300);
      } catch (err) {
        showError(SimpleShopAuthApi?.formatError?.(err) || 'ورود ناموفق — موبایل یا رمز را بررسی کنید.');
        if (!supplierLoginMode && roleInput) roleInput.value = 'Customer';
      } finally {
        setSubmitLoading(submitBtn, false);
      }
    });
  };

  const initRegisterForm = () => {
    const submitBtn = document.getElementById('register-submit');

    document.getElementById('register-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      showError('');
      showHint('');

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

      setSubmitLoading(submitBtn, true);

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

        const resolvedRole = pick(data, 'role', 'Role') || role;
        saveAuthResult({ ...data, fullName: `${firstName} ${lastName}`.trim() }, resolvedRole);
        setTimeout(() => redirectAfterAuth(resolvedRole), 300);
      } catch (err) {
        showError(SimpleShopAuthApi?.formatError?.(err) || 'ثبت‌نام ناموفق بود.');
      } finally {
        setSubmitLoading(submitBtn, false);
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initRoleSwitch();
    initPasswordToggle('login-password', 'toggle-login-password', 'toggle-login-password-icon');
    initPasswordToggle('register-password', 'toggle-register-password', 'toggle-register-password-icon');
    initLoginForm();
    initRegisterForm();
  });
})(window.SimpleStore = window.SimpleStore || {});
