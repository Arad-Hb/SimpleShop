/**
 * utils.js — توابع کمکی عمومی
 */
(function (ShopAdmin) {
  'use strict';

  const escapeHtml = (str) => {
    if (str == null) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str).replace(/[&<>"']/g, (ch) => map[ch]);
  };

  const formatPrice = (amount, { showCurrency = true } = {}) => {
    const num = Number(amount) || 0;
    const formatted = num.toLocaleString('fa-IR');
    return showCurrency ? `${formatted} تومان` : formatted;
  };

  /** نمایش تاریخ شمسی در UI — مقدار ذخیره‌شده همیشه ISO/میلادی می‌ماند */
  const PERSIAN_LOCALE = 'fa-IR-u-ca-persian';

  const formatDate = (dateInput, options = {}) => {
    if (!dateInput) return '—';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(PERSIAN_LOCALE, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    });
  };

  const formatDateTime = (dateInput) => {
    if (!dateInput) return '—';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(PERSIAN_LOCALE, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /** برچسب ماه شمسی برای یک تاریخ میلادی ذخیره‌شده */
  const formatPersianMonth = (dateInput) => {
    if (!dateInput) return '—';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(PERSIAN_LOCALE, { year: 'numeric', month: 'long' });
  };

  /** تبدیل متن فارسی/انگلیسی به slug */
  const slugify = (text) => {
    if (!text) return '';
    return String(text)
      .trim()
      .toLowerCase()
      .replace(/[\u200C\u200F\u202A-\u202E]/g, '')
      .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const generateId = (prefix = '') => {
    const rand = Math.random().toString(36).slice(2, 10);
    const time = Date.now().toString(36);
    return prefix ? `${prefix}_${time}${rand}` : `${time}${rand}`;
  };

  const debounce = (fn, delay = 300) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const parseQuery = (search = window.location.search) => {
    const params = new URLSearchParams(search);
    const result = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  };

  const STOCK_BADGES = {
    available: { label: 'موجود', class: 'bg-success' },
    low: { label: 'کم موجود', class: 'bg-warning text-dark' },
    out: { label: 'ناموجود', class: 'bg-danger' },
    inactive: { label: 'غیرفعال', class: 'bg-secondary' }
  };

  const getStockBadge = (product) => {
    const status = ShopAdmin.storage?.getProductStockStatus(product) ?? 'out';
    const badge = STOCK_BADGES[status] || STOCK_BADGES.out;
    return `<span class="badge ${badge.class}">${escapeHtml(badge.label)}</span>`;
  };

  const STATUS_BADGES = {
    pending: { label: 'در انتظار', class: 'bg-warning text-dark' },
    approved: { label: 'تأیید شده', class: 'bg-success' },
    rejected: { label: 'رد شده', class: 'bg-danger' },
    active: { label: 'فعال', class: 'bg-success' },
    inactive: { label: 'غیرفعال', class: 'bg-secondary' },
    processing: { label: 'در حال پردازش', class: 'bg-info text-dark' },
    shipped: { label: 'ارسال شده', class: 'bg-primary' },
    delivered: { label: 'تحویل شده', class: 'bg-success' },
    cancelled: { label: 'لغو شده', class: 'bg-danger' },
    paid: { label: 'پرداخت شده', class: 'bg-success' },
    unpaid: { label: 'پرداخت نشده', class: 'bg-warning text-dark' },
    refunded: { label: 'مرجوعی', class: 'bg-secondary' },
    converted: { label: 'تبدیل‌شده', class: 'bg-success' },
    abandoned: { label: 'رها شده', class: 'bg-secondary' }
  };

  const getStatusBadge = (status, customLabel) => {
    const badge = STATUS_BADGES[status] || { label: status, class: 'bg-secondary' };
    const label = customLabel ?? badge.label;
    return `<span class="badge ${badge.class}">${escapeHtml(label)}</span>`;
  };

  ShopAdmin.utils = {
    escapeHtml,
    formatPrice,
    formatDate,
    formatDateTime,
    formatPersianMonth,
    slugify,
    generateId,
    debounce,
    parseQuery,
    getStockBadge,
    getStatusBadge,
    STOCK_BADGES,
    STATUS_BADGES
  };
})(window.ShopAdmin = window.ShopAdmin || {});
