/**
 * settings.js — سازمان فروش (اطلاعات عمومی / تصویر / شبکه‌های اجتماعی)
 */
(function (ShopAdmin) {
  'use strict';

  const { generateId } = ShopAdmin.utils;
  const { validateRequired, validateForm, validateImageFile } = ShopAdmin.validation;
  const { getData, saveData, imageStore, syncPublicBranding, STORAGE_KEY } = ShopAdmin.storage;
  const DEFAULT_SHOP_NAME = (window.SimpleShopSite && window.SimpleShopSite.name) || 'فروشگاه ساده تحلیل داده';

  /** @type {Record<string, string|null>} */
  let objectUrls = {};
  /** @type {Record<string, string|null>} */
  let pendingImageIds = {
    logoId: null,
    faviconId: null,
    ogImageId: null
  };
  /** @type {Record<string, boolean>} */
  let removedImages = {
    logoId: false,
    faviconId: false,
    ogImageId: false
  };

  const $ = (id) => document.getElementById(id);

  const revokeUrl = (key) => {
    if (objectUrls[key]) {
      URL.revokeObjectURL(objectUrls[key]);
      objectUrls[key] = null;
    }
  };

  const setMediaPreview = async (kind, imageId) => {
    const img = $(`${kind}-preview`);
    const empty = $(`${kind}-placeholder`);
    if (!img || !empty) return;

    revokeUrl(kind);

    if (!imageId) {
      img.hidden = true;
      img.removeAttribute('src');
      empty.hidden = false;
      return;
    }

    const blob = await imageStore.getImage(imageId);
    if (!blob) {
      img.hidden = true;
      empty.hidden = false;
      return;
    }

    objectUrls[kind] = URL.createObjectURL(blob);
    img.src = objectUrls[kind];
    img.hidden = false;
    empty.hidden = true;
  };

  const updateSeoPreview = () => {
    const title = ($('defaultSeoTitle')?.value || '').trim() || 'عنوان صفحه';
    const desc = ($('defaultSeoDescription')?.value || '').trim() || 'توضیحات متا...';
    if ($('seo-preview-title')) $('seo-preview-title').textContent = title;
    if ($('seo-preview-desc')) $('seo-preview-desc').textContent = desc;
  };

  const syncPublicToggleFromSelect = () => {
    const select = $('shopVisibility');
    const toggle = $('orgPublicToggle');
    if (!select || !toggle) return;
    toggle.checked = select.value === 'public';
  };

  const fillForm = async (settings = {}) => {
    const s = settings || {};
    if ($('shopName')) $('shopName').value = s.shopName || '';
    if ($('shopDescription')) $('shopDescription').value = s.shopDescription || '';
    if ($('contactPhone')) $('contactPhone').value = s.contactPhone || '';
    if ($('contactEmail')) $('contactEmail').value = s.contactEmail || '';
    if ($('address')) $('address').value = s.address || '';
    if ($('currency')) $('currency').value = s.currency || 'تومان';
    if ($('lowStockThreshold')) $('lowStockThreshold').value = s.lowStockThreshold ?? 10;
    if ($('shopVisibility')) $('shopVisibility').value = s.shopVisibility || 'public';

    if ($('instagram')) $('instagram').value = s.instagram || '';
    if ($('telegram')) $('telegram').value = s.telegram || '';
    if ($('whatsapp')) $('whatsapp').value = s.whatsapp || '';

    const igOn = s.instagramEnabled != null ? !!s.instagramEnabled : !!(s.instagram || '').trim();
    const tgOn = s.telegramEnabled != null ? !!s.telegramEnabled : !!(s.telegram || '').trim();
    const waOn = s.whatsappEnabled != null ? !!s.whatsappEnabled : !!(s.whatsapp || '').trim();
    if ($('socialInstagramEnabled')) $('socialInstagramEnabled').checked = igOn;
    if ($('socialTelegramEnabled')) $('socialTelegramEnabled').checked = tgOn;
    if ($('socialWhatsappEnabled')) $('socialWhatsappEnabled').checked = waOn;

    if ($('defaultSeoTitle')) $('defaultSeoTitle').value = s.defaultSeoTitle || s.seoTitle || '';
    if ($('defaultSeoDescription')) $('defaultSeoDescription').value = s.defaultSeoDescription || s.seoDescription || '';

    pendingImageIds = {
      logoId: s.logoId || null,
      faviconId: s.faviconId || null,
      ogImageId: s.ogImageId || null
    };
    removedImages = { logoId: false, faviconId: false, ogImageId: false };

    syncPublicToggleFromSelect();
    updateSeoPreview();

    await setMediaPreview('logo', pendingImageIds.logoId);
    await setMediaPreview('favicon', pendingImageIds.faviconId);
    await setMediaPreview('og', pendingImageIds.ogImageId);

    if (typeof ShopAdmin.ui.enhanceFormSelects === 'function') {
      ShopAdmin.ui.enhanceFormSelects(document.getElementById('settings-form') || document);
    }
  };

  const collectSettings = (existing = {}) => {
    const visibility = $('shopVisibility')?.value || 'public';
    return {
      ...existing,
      shopName: ($('shopName')?.value || '').trim(),
      shopDescription: ($('shopDescription')?.value || '').trim(),
      contactPhone: ($('contactPhone')?.value || '').trim(),
      contactEmail: ($('contactEmail')?.value || '').trim(),
      address: ($('address')?.value || '').trim(),
      currency: ($('currency')?.value || 'تومان').trim(),
      lowStockThreshold: Number($('lowStockThreshold')?.value ?? 10),
      shopVisibility: visibility,
      instagram: ($('instagram')?.value || '').trim(),
      telegram: ($('telegram')?.value || '').trim(),
      whatsapp: ($('whatsapp')?.value || '').trim(),
      instagramEnabled: !!$('socialInstagramEnabled')?.checked,
      telegramEnabled: !!$('socialTelegramEnabled')?.checked,
      whatsappEnabled: !!$('socialWhatsappEnabled')?.checked,
      defaultSeoTitle: ($('defaultSeoTitle')?.value || '').trim(),
      defaultSeoDescription: ($('defaultSeoDescription')?.value || '').trim(),
      logoId: removedImages.logoId ? null : (pendingImageIds.logoId || existing.logoId || null),
      faviconId: removedImages.faviconId ? null : (pendingImageIds.faviconId || existing.faviconId || null),
      ogImageId: removedImages.ogImageId ? null : (pendingImageIds.ogImageId || existing.ogImageId || null),
      updatedAt: new Date().toISOString()
    };
  };

  const switchTopTab = (tabId) => {
    document.querySelectorAll('[data-settings-tab]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-settings-tab') === tabId);
    });
    document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
      const match = panel.getAttribute('data-tab-panel') === tabId;
      panel.hidden = !match;
      panel.classList.toggle('is-active', match);
    });
  };

  const switchOrgPanel = (panelId) => {
    document.querySelectorAll('[data-org-panel]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-org-panel') === panelId);
    });
    document.querySelectorAll('[data-org-content]').forEach((panel) => {
      const match = panel.getAttribute('data-org-content') === panelId;
      panel.hidden = !match;
      panel.classList.toggle('is-active', match);
    });
  };

  const bindImageUpload = (inputId, kind, settingKey) => {
    $(inputId)?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const err = validateImageFile(file);
      if (err) {
        ShopAdmin.ui.showToast('error', err);
        e.target.value = '';
        return;
      }

      const oldPending = pendingImageIds[settingKey];
      const savedId = getData().settings?.[settingKey] || null;
      const newId = generateId(kind);
      await imageStore.saveImage(newId, file);
      if (oldPending && oldPending !== savedId && oldPending !== newId) {
        await imageStore.deleteImage(oldPending).catch(() => {});
      }

      pendingImageIds[settingKey] = newId;
      removedImages[settingKey] = false;
      await setMediaPreview(kind, newId);
      e.target.value = '';
      ShopAdmin.ui.showToast('success', 'تصویر آماده ذخیره است.');
    });
  };

  const bindNavigation = () => {
    document.querySelectorAll('[data-settings-tab]').forEach((btn) => {
      btn.addEventListener('click', () => switchTopTab(btn.getAttribute('data-settings-tab')));
    });
    document.querySelectorAll('[data-org-panel]').forEach((btn) => {
      btn.addEventListener('click', () => switchOrgPanel(btn.getAttribute('data-org-panel')));
    });
  };

  const bindEvents = () => {
    bindNavigation();

    $('orgPublicToggle')?.addEventListener('change', () => {
      const select = $('shopVisibility');
      if (!select) return;
      select.value = $('orgPublicToggle').checked ? 'public' : 'private';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    $('shopVisibility')?.addEventListener('change', syncPublicToggleFromSelect);

    ['defaultSeoTitle', 'defaultSeoDescription'].forEach((id) => {
      $(id)?.addEventListener('input', updateSeoPreview);
    });

    bindImageUpload('logo-upload', 'logo', 'logoId');
    bindImageUpload('favicon-upload', 'favicon', 'faviconId');
    bindImageUpload('og-upload', 'og', 'ogImageId');

    $('logo-remove')?.addEventListener('click', async () => {
      pendingImageIds.logoId = null;
      removedImages.logoId = true;
      await setMediaPreview('logo', null);
      ShopAdmin.ui.showToast('info', 'لوگو پس از ذخیره حذف می‌شود.');
    });

    const form = $('settings-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const result = validateForm(form, [
        { name: 'shopName', label: 'نام فروشگاه', rules: [validateRequired] }
      ]);
      if (!result.valid) {
        switchTopTab('organization');
        switchOrgPanel('general');
        $('shopName')?.focus();
        return;
      }

      const data = getData();
      const prev = data.settings || {};
      const next = collectSettings(prev);

      // Delete replaced / removed image blobs after a successful collect
      const imageKeys = ['logoId', 'faviconId', 'ogImageId'];
      for (const key of imageKeys) {
        const prevId = prev[key];
        const nextId = next[key];
        if (prevId && prevId !== nextId) {
          await imageStore.deleteImage(prevId).catch(() => {});
        }
      }

      data.settings = next;
      saveData(data);
      removedImages = { logoId: false, faviconId: false, ogImageId: false };

      const shopNameEl = document.querySelector('[data-shop-name]');
      if (shopNameEl) shopNameEl.textContent = next.shopName || DEFAULT_SHOP_NAME;

      try {
        await syncPublicBranding(next);
      } catch (_) { /* ignore branding sync errors */ }

      ShopAdmin.ui.showToast('success', 'تنظیمات سازمان فروش ذخیره شد.');
    });

    form?.addEventListener('reset', (e) => {
      e.preventDefault();
      fillForm(getData().settings || {});
      ShopAdmin.ui.showToast('info', 'فرم به آخرین مقادیر ذخیره‌شده برگشت.');
    });

    $('btn-reset-demo')?.addEventListener('click', () => {
      ShopAdmin.ui.showConfirmModal(
        'بازنشانی داده‌های محلی',
        'همه داده‌های LocalStorage پاک می‌شوند. پس از بارگذاری مجدد، داده از API یا فایل‌های JSON آفلاین بارگذاری می‌شود.',
        () => {
          localStorage.removeItem(STORAGE_KEY);
          window.location.reload();
        }
      );
    });
  };

  const initSettings = async () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'سازمان فروش' }
    ]);

    bindEvents();
    await fillForm(getData().settings || {});
    switchTopTab('organization');
    switchOrgPanel('general');
  };

  document.addEventListener('DOMContentLoaded', initSettings);
})(window.ShopAdmin = window.ShopAdmin || {});
