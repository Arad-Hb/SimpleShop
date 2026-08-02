/**
 * search-filter.js — توابع جست‌وجو و فیلتر مشترک
 */
(function (ShopAdmin) {
  'use strict';

  const { debounce } = ShopAdmin.utils;

  /** فیلتر متنی چندفیلدی */
  const filterBySearch = (items, search, fields) => {
    const q = String(search || '').trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      fields.some((field) => {
        const val = field.split('.').reduce((o, k) => o?.[k], item);
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  };

  /** فیلتر بر اساس مقدار فیلد */
  const filterByField = (items, field, value) => {
    if (value === '' || value == null || value === 'all') return items;
    return items.filter((item) => {
      const val = field.split('.').reduce((o, k) => o?.[k], item);
      return String(val) === String(value);
    });
  };

  /** فیلتر بازه عددی */
  const filterByRange = (items, field, min, max) => {
    return items.filter((item) => {
      const val = Number(field.split('.').reduce((o, k) => o?.[k], item)) || 0;
      if (min !== '' && min != null && val < Number(min)) return false;
      if (max !== '' && max != null && val > Number(max)) return false;
      return true;
    });
  };

  /** فیلتر بازه تاریخ ISO */
  const filterByDateRange = (items, field, from, to) => {
    return items.filter((item) => {
      const raw = field.split('.').reduce((o, k) => o?.[k], item);
      if (!raw) return false;
      const d = new Date(raw).getTime();
      if (from && d < new Date(from).getTime()) return false;
      if (to && d > new Date(to).getTime() + 86400000) return false;
      return true;
    });
  };

  ShopAdmin.searchFilter = {
    filterBySearch,
    filterByField,
    filterByRange,
    filterByDateRange,
    debounce
  };
})(window.ShopAdmin = window.ShopAdmin || {});
