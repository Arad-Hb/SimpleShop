/**
 * utils.js — توابع کمکی پنل تأمین‌کننده
 */
(function (ShopSupplier) {
  'use strict';

  const escapeHtml = (str) => {
    if (str == null) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str).replace(/[&<>"']/g, (ch) => map[ch]);
  };

  const formatPrice = (amount) => {
    const num = Number(amount) || 0;
    return `${num.toLocaleString('fa-IR')} تومان`;
  };

  /** نمایش تاریخ شمسی در UI — مقدار ذخیره‌شده همیشه ISO/میلادی می‌ماند */
  const PERSIAN_LOCALE = 'fa-IR-u-ca-persian';

  const formatDate = (dateInput) => {
    if (!dateInput) return '—';
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(PERSIAN_LOCALE, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateTime = (dateInput) => {
    if (!dateInput) return '—';
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(PERSIAN_LOCALE, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateId = (prefix = 'id') =>
    `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

  const showToast = (message, type = 'success') => {
    if (ShopSupplier.ui?.showToast) {
      ShopSupplier.ui.showToast(type, message);
      return;
    }
    alert(message);
  };

  ShopSupplier.utils = { escapeHtml, formatPrice, formatDate, formatDateTime, generateId, showToast };
})(window.ShopSupplier = window.ShopSupplier || {});
