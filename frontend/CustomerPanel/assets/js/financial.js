(function (ShopCustomer) {
  'use strict';

  const onlyDigits = (value) => String(value || '').replace(/\D/g, '');

  const formatCard = (value) => {
    const digits = onlyDigits(value).slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1-');
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (!ShopCustomer.auth.requireAuth()) return;

    ShopCustomer.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'اطلاعات مالی' }
    ]);

    const financial = ShopCustomer.storage.getFinancial() || {};
    const profile = ShopCustomer.storage.getProfile() || {};

    document.getElementById('bankName').value = financial.bankName || '';
    document.getElementById('accountHolder').value = financial.accountHolder || ShopCustomer.utils.fullName(profile);
    document.getElementById('cardNumber').value = formatCard(financial.cardNumber || '');
    document.getElementById('sheba').value = financial.sheba || '';

    const cardInput = document.getElementById('cardNumber');
    cardInput?.addEventListener('input', () => {
      const pos = cardInput.selectionStart;
      const before = cardInput.value.length;
      cardInput.value = formatCard(cardInput.value);
      const after = cardInput.value.length;
      const next = Math.max(0, (pos || 0) + (after - before));
      cardInput.setSelectionRange(next, next);
    });

    document.getElementById('financial-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const accountHolder = document.getElementById('accountHolder').value.trim();
      if (!accountHolder) {
        ShopCustomer.ui.showToast('error', 'نام صاحب حساب الزامی است.');
        return;
      }

      const cardNumber = onlyDigits(document.getElementById('cardNumber').value);
      const sheba = document.getElementById('sheba').value.trim().toUpperCase();

      if (cardNumber && cardNumber.length !== 16) {
        ShopCustomer.ui.showToast('error', 'شماره کارت باید ۱۶ رقم باشد.');
        return;
      }
      if (sheba && !/^IR\d{24}$/.test(sheba)) {
        ShopCustomer.ui.showToast('error', 'شبا باید با IR و ۲۴ رقم باشد.');
        return;
      }

      ShopCustomer.storage.saveFinancial({
        ...financial,
        bankName: document.getElementById('bankName').value.trim(),
        accountHolder,
        cardNumber,
        sheba
      });

      ShopCustomer.ui.showToast('success', 'اطلاعات مالی ذخیره شد.');
    });
  });
})(window.ShopCustomer = window.ShopCustomer || {});
