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

    toggleBtn?.addEventListener('click', () => {
      const show = passwordInput.type === 'password';
      passwordInput.type = show ? 'text' : 'password';
      toggleIcon.className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
      toggleBtn.setAttribute('aria-pressed', String(show));
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      errorBox?.classList.add('d-none');
      const username = form.username.value;
      const password = form.password.value;
      const rememberMe = form.rememberMe?.checked;
      const result = ShopSupplier.auth.login(username, password, rememberMe);
      if (!result.success) {
        errorBox.textContent = result.message;
        errorBox.classList.remove('d-none');
        return;
      }
      window.location.href = 'index.html';
    });
  });
})(window.ShopSupplier = window.ShopSupplier || {});
