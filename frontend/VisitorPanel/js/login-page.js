(function (Store) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('email')?.value?.trim();
      const password = document.getElementById('password')?.value || '';
      try {
        if (Store.config?.USE_API && Store.api) {
          await Store.api.login(username, password);
          Store.ui.showToast('ورود با API موفق بود');
        } else {
          Store.ui.showToast('ورود دمو انجام شد');
        }
        setTimeout(() => { window.location.href = 'index.html'; }, 700);
      } catch {
        Store.ui.showToast('ورود ناموفق — نام کاربری یا رمز را بررسی کنید');
      }
    });
  });
})(window.SimpleStore = window.SimpleStore || {});
