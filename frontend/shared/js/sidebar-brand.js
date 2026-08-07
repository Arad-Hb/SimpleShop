/**
 * sidebar-brand.js — TahlilDadeh logo + shop name for panel sidebars
 */
(function (global) {
  'use strict';

  const defaultEscape = (s) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const ensure = (brand, { escapeHtml = defaultEscape, homeHref = 'index.html', logoUrl = '../shared/assets/img/tahlildadeh-logo.png' } = {}) => {
    if (!brand) return;

    if (brand.querySelector('.sidebar-brand__link')) {
      brand.classList.remove('customer-sidebar-brand');
      brand.classList.add('sidebar-brand--tahlil');
      return;
    }

    const site = global.SimpleShopSite || {};
    const existingName = brand.querySelector('[data-shop-name]')?.textContent?.trim();
    const shopName = existingName || site.name || 'فروشگاه ساده تحلیل داده';
    const tagline = site.tagline || 'فروشگاه اینترنتی آموزشی';

    brand.querySelector('.bi-shop')?.remove();
    brand.querySelector('.bi-truck')?.remove();
    brand.querySelector('.customer-avatar-wrap')?.remove();
    brand.querySelector('.customer-sidebar-chip')?.remove();
    brand.querySelector(':scope > [data-shop-name]')?.remove();
    brand.querySelector(':scope > [data-company-name]')?.remove();
    brand.querySelector(':scope > [data-customer-brand]')?.remove();
    brand.classList.remove('customer-sidebar-brand');

    const link = document.createElement('a');
    link.href = homeHref;
    link.className = 'sidebar-brand__link brand brand--tahlil';
    link.innerHTML = `
      <span class="brand-mark brand-mark--logo has-logo">
        <img src="${logoUrl}" alt="${escapeHtml(shopName)}" class="brand-logo-img" width="120" height="48" decoding="async">
      </span>
      <span class="brand-text">
        <strong data-shop-name>${escapeHtml(shopName)}</strong>
        <small data-shop-tagline>${escapeHtml(tagline)}</small>
      </span>`;

    const collapseBtn = brand.querySelector('[data-sidebar-collapse]');
    if (collapseBtn) collapseBtn.insertAdjacentElement('afterend', link);
    else brand.appendChild(link);

    brand.classList.add('sidebar-brand--tahlil');
  };

  global.SimpleShopSidebarBrand = { ensure };
})(window);
