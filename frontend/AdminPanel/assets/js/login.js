/**
 * login.js — صفحه ورود پنل مدیریت
 */
(function (ShopAdmin) {
  'use strict';

  const initLogin = () => {
    if (ShopAdmin.auth.isAuthenticated()) {
      window.location.href = 'index.html';
      return;
    }

    const form = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('toggle-password');
    const toggleIcon = document.getElementById('toggle-password-icon');
    const errorEl = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit');
    const submitText = submitBtn?.querySelector('.submit-text');
    const submitLoading = submitBtn?.querySelector('.submit-loading');

    if (toggleBtn && passwordInput) {
      toggleBtn.addEventListener('click', () => {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        toggleBtn.setAttribute('aria-pressed', String(isHidden));
        toggleBtn.setAttribute('aria-label', isHidden ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور');
        if (toggleIcon) {
          toggleIcon.className = isHidden ? 'bi bi-eye-slash' : 'bi bi-eye';
        }
      });
    }

    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      errorEl?.classList.add('d-none');

      const { valid } = ShopAdmin.validation.validateForm(form, [
        {
          name: 'username',
          label: 'نام کاربری',
          rules: [(v) => ShopAdmin.validation.validateRequired(v, 'نام کاربری')]
        },
        {
          name: 'password',
          label: 'رمز عبور',
          rules: [(v) => ShopAdmin.validation.validateRequired(v, 'رمز عبور')]
        }
      ]);

      if (!valid) return;

      const username = form.username.value;
      const password = form.password.value;
      const rememberMe = form.rememberMe.checked;

      submitBtn.disabled = true;
      submitText?.classList.add('d-none');
      submitLoading?.classList.remove('d-none');

      const result = ShopAdmin.auth.login(username, password, rememberMe);

      if (result.success) {
        window.location.href = 'index.html';
        return;
      }

      submitBtn.disabled = false;
      submitText?.classList.remove('d-none');
      submitLoading?.classList.add('d-none');

      if (errorEl) {
        errorEl.textContent = result.message || 'خطا در ورود.';
        errorEl.classList.remove('d-none');
      } else {
        ShopAdmin.ui.showToast('error', result.message || 'خطا در ورود.');
      }
    });
  };

  document.addEventListener('DOMContentLoaded', initLogin);
})(window.ShopAdmin = window.ShopAdmin || {});
