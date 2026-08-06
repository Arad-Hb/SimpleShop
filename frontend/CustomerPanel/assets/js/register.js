(function (ShopCustomer) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (ShopCustomer.auth.isAuthenticated()) {
      window.location.href = 'index.html';
      return;
    }

    const form = document.getElementById('register-form');
    const errorBox = document.getElementById('register-error');
    const submitBtn = form?.querySelector('button[type="submit"]');
    const toggleBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggle-password-icon');

    toggleBtn?.addEventListener('click', () => {
      const show = passwordInput.type === 'password';
      passwordInput.type = show ? 'text' : 'password';
      toggleIcon.className = show ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill';
      toggleBtn.setAttribute('aria-pressed', String(show));
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox?.classList.add('d-none');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const result = await ShopCustomer.auth.register({
          firstName: form.firstName.value,
          lastName: form.lastName.value,
          username: form.username.value,
          email: form.email.value,
          mobile: form.mobile.value,
          password: form.password.value
        });

        if (!result.success) {
          errorBox.textContent = result.message;
          errorBox.classList.remove('d-none');
          return;
        }

        window.location.href = 'login.html';
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
})(window.ShopCustomer = window.ShopCustomer || {});
