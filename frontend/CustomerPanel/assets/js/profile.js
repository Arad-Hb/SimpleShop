(function (ShopCustomer) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (!ShopCustomer.auth.requireAuth()) return;

    ShopCustomer.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'پروفایل من' }
    ]);

    const profile = ShopCustomer.storage.getProfile() || {};
    const fields = [
      'firstName', 'lastName', 'email', 'mobile', 'phone',
      'nationalId', 'postalCode', 'address'
    ];

    fields.forEach((key) => {
      const el = document.getElementById(key);
      if (el) el.value = profile[key] || '';
    });

    const usernameEl = document.getElementById('username');
    if (usernameEl) usernameEl.value = profile.username || ShopCustomer.auth.getSession()?.username || '';

    document.getElementById('profile-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      const email = document.getElementById('email').value.trim();
      const mobile = document.getElementById('mobile').value.trim();

      if (!firstName || !lastName || !email || !mobile) {
        ShopCustomer.ui.showToast('error', 'نام، نام خانوادگی، ایمیل و موبایل الزامی است.');
        return;
      }

      const saved = ShopCustomer.storage.saveProfile({
        ...profile,
        firstName,
        lastName,
        email,
        mobile,
        phone: document.getElementById('phone').value.trim(),
        nationalId: document.getElementById('nationalId').value.trim(),
        postalCode: document.getElementById('postalCode').value.trim(),
        address: document.getElementById('address').value.trim()
      });

      const name = ShopCustomer.utils.fullName(saved);
      document.querySelectorAll('[data-customer-brand], [data-customer-name]').forEach((el) => {
        el.textContent = name;
      });

      ShopCustomer.ui.showToast('success', 'پروفایل ذخیره شد.');
    });
  });
})(window.ShopCustomer = window.ShopCustomer || {});
