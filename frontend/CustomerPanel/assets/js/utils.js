/**
 * utils.js — توابع کمکی پنل مشتری
 */
(function (ShopCustomer) {
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
    if (ShopCustomer.ui?.showToast) {
      ShopCustomer.ui.showToast(type, message);
      return;
    }
    alert(message);
  };

  const fullName = (profile) => {
    if (!profile) return 'مشتری';
    const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    return name || profile.username || 'مشتری';
  };

  ShopCustomer.utils = {
    escapeHtml,
    formatPrice,
    formatDate,
    formatDateTime,
    generateId,
    showToast,
    fullName
  };
})(window.ShopCustomer = window.ShopCustomer || {});
