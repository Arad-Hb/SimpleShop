(function (ShopSupplier) {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (!ShopSupplier.auth.requireAuth()) return;

    ShopSupplier.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'پروفایل تأمین‌کننده' }
    ]);

    const switchPanel = (panelId) => {
      document.querySelectorAll('[data-profile-panel]').forEach((btn) => {
        btn.classList.toggle('is-active', btn.getAttribute('data-profile-panel') === panelId);
      });
      document.querySelectorAll('[data-profile-content]').forEach((panel) => {
        const match = panel.getAttribute('data-profile-content') === panelId;
        panel.hidden = !match;
        panel.classList.toggle('is-active', match);
      });
    };
    document.querySelectorAll('[data-profile-panel]').forEach((btn) => {
      btn.addEventListener('click', () => switchPanel(btn.getAttribute('data-profile-panel')));
    });
    switchPanel('general');

    const profile = ShopSupplier.storage.getProfile() || {};
    const stats = ShopSupplier.storage.stats();

    document.getElementById('stat-products').textContent = stats.productCount.toLocaleString('fa-IR');
    document.getElementById('stat-brands').textContent = stats.brandCount.toLocaleString('fa-IR');
    document.getElementById('stat-stock').textContent = stats.totalStock.toLocaleString('fa-IR');

    const fields = [
      'companyName', 'contactPerson', 'email', 'phone', 'mobile', 'address', 'website', 'description'
    ];
    fields.forEach((key) => {
      const el = document.getElementById(key);
      if (el) el.value = profile[key] || '';
    });

    document.getElementById('profile-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const companyName = document.getElementById('companyName').value.trim();
      const contactPerson = document.getElementById('contactPerson').value.trim();
      if (!companyName || !contactPerson) {
        ShopSupplier.ui.showToast('error', 'نام شرکت و نام مسئول الزامی است.');
        return;
      }

      ShopSupplier.storage.saveProfile({
        ...profile,
        companyName,
        contactPerson,
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        mobile: document.getElementById('mobile').value.trim(),
        address: document.getElementById('address').value.trim(),
        website: document.getElementById('website').value.trim(),
        description: document.getElementById('description').value.trim()
      });

      const companyEl = document.querySelector('[data-company-name]');
      if (companyEl) companyEl.textContent = companyName;
      const userEl = document.querySelector('[data-supplier-name]');
      if (userEl) userEl.textContent = contactPerson;

      ShopSupplier.ui.showToast('success', 'پروفایل ذخیره شد.');
    });
  });
})(window.ShopSupplier = window.ShopSupplier || {});
