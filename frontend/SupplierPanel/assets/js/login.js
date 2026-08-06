(function (ShopSupplier) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (ShopSupplier.auth.isAuthenticated()) {
      window.location.href = 'index.html';
      return;
    }

    ShopSupplier.seed.seedDemoData();

    const form = document.getElementById('login-form');
    const errorBox = document.getElementById('login-error');
    const toggleBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggle-password-icon');
    const submitBtn = document.getElementById('login-submit');

    toggleBtn?.addEventListener('click', () => {
      const show = passwordInput.type === 'password';
      passwordInput.type = show ? 'text' : 'password';
      toggleIcon.className = show ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill';
      toggleBtn.setAttribute('aria-pressed', String(show));
    });

    document.querySelector('.login-forgot')?.addEventListener('click', (e) => {
      e.preventDefault();
      ShopSupplier.ui?.showToast?.('info', 'بازیابی رمز عبور در نسخه دمو فعال نیست.');
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox?.classList.add('d-none');

      const username = form.username.value;
      const password = form.password.value;
      const rememberMe = form.rememberMe?.checked;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'در حال ورود...';
      }

      const result = await ShopSupplier.auth.login(username, password, rememberMe);

      if (result.success) {
        window.location.href = 'index.html';
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'ورود به پنل';
      }

      errorBox.textContent = result.message;
      errorBox.classList.remove('d-none');
    });
  });
})(window.ShopSupplier = window.ShopSupplier || {});
