/**
 * pagination.js — صفحه‌بندی و مرتب‌سازی
 */
(function (ShopAdmin) {
  'use strict';

  /**
   * برش آرایه برای صفحه جاری
   * @returns {{ items: Array, page: number, pageSize: number, totalItems: number, totalPages: number }}
   */
  const paginate = (items, page = 1, pageSize = 10) => {
    const list = Array.isArray(items) ? items : [];
    const totalItems = list.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;

    return {
      items: list.slice(start, end),
      page: safePage,
      pageSize,
      totalItems,
      totalPages
    };
  };

  /**
   * مرتب‌سازی آرایه بر اساس فیلد
   * @param {'asc'|'desc'} dir
   */
  const sortItems = (items, field, dir = 'asc') => {
    const list = [...(items || [])];
    const multiplier = dir === 'desc' ? -1 : 1;

    list.sort((a, b) => {
      let valA = a?.[field];
      let valB = b?.[field];

      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB, 'fa') * multiplier;
      }

      if (valA instanceof Date || valB instanceof Date) {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * multiplier;
      }

      return String(valA).localeCompare(String(valB), 'fa') * multiplier;
    });

    return list;
  };

  ShopAdmin.pagination = { paginate, sortItems };
})(window.ShopAdmin = window.ShopAdmin || {});
