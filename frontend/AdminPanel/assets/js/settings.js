/**
 * settings.js — سازمان فروش (اطلاعات عمومی / تصویر / شبکه‌های اجتماعی)
 */
(function (ShopAdmin) {
  'use strict';

  const { validateRequired, validateForm, validateImageFile } = ShopAdmin.validation;
  const { syncPublicBranding, STORAGE_KEY } = ShopAdmin.storage;
  const DEFAULT_SHOP_NAME = (window.SimpleShopSite && window.SimpleShopSite.name) || 'فروشگاه ساده تحلیل داده';

  const pick = (dto, camel, pascal) => dto?.[camel] ?? dto?.[pascal];

  const mapSettingsFromApi = (data = {}) => ({
    shopName: data.shopName || '',
    shopDescription: data.shopDescription || '',
    contactPhone: data.contactPhone || '',
    contactEmail: data.contactEmail || '',
    address: data.address || '',
    currency: data.currency || 'تومان',
    lowStockThreshold: data.lowStockThreshold ?? 10,
    shopVisibility: data.shopVisibility || 'public',
    instagram: data.instagram || '',
    telegram: data.telegram || '',
    whatsapp: data.whatsapp || '',
    instagramEnabled: !!data.instagramEnabled,
    telegramEnabled: !!data.telegramEnabled,
    whatsappEnabled: !!data.whatsappEnabled,
    defaultSeoTitle: data.defaultSeoTitle || '',
    defaultSeoDescription: data.defaultSeoDescription || '',
    logoFileId: data.logoFileId ?? null,
    logoUrl: data.logoUrl || null,
    faviconFileId: data.faviconFileId ?? null,
    faviconUrl: data.faviconUrl || null,
    ogImageFileId: data.ogImageFileId ?? null,
    ogImageUrl: data.ogImageUrl || null,
    updatedAt: data.updatedAt || null
  });

  const mapSettingsToApi = (settings = {}) => ({
    shopName: settings.shopName || DEFAULT_SHOP_NAME,
    shopDescription: settings.shopDescription || null,
    contactPhone: settings.contactPhone || null,
    contactEmail: settings.contactEmail || null,
    address: settings.address || null,
    currency: settings.currency || 'تومان',
    lowStockThreshold: Number(settings.lowStockThreshold ?? 10),
    shopVisibility: settings.shopVisibility === 'private' ? 'private' : 'public',
    instagram: settings.instagram || null,
    telegram: settings.telegram || null,
    whatsapp: settings.whatsapp || null,
    instagramEnabled: !!settings.instagramEnabled,
    telegramEnabled: !!settings.telegramEnabled,
    whatsappEnabled: !!settings.whatsappEnabled,
    defaultSeoTitle: settings.defaultSeoTitle || null,
    defaultSeoDescription: settings.defaultSeoDescription || null,
    logoFileId: settings.logoFileId ?? null,
    faviconFileId: settings.faviconFileId ?? null,
    ogImageFileId: settings.ogImageFileId ?? null
  });

  /** @type {Record<string, string|null>} */
  let objectUrls = {};

  const imageState = {
    logoFileId: null,
    faviconFileId: null,
    ogImageFileId: null,
    pendingLogoFile: null,
    pendingFaviconFile: null,
    pendingOgFile: null,
    removedLogo: false,
    removedFavicon: false,
    removedOg: false
  };

  const $ = (id) => document.getElementById(id);

  const revokeUrl = (key) => {
    if (objectUrls[key]) {
      URL.revokeObjectURL(objectUrls[key]);
      objectUrls[key] = null;
    }
  };

  const resolvePreviewSrc = (url, blobUrl) => {
    if (blobUrl) return blobUrl;
    if (!url) return '';
    if (/^blob:|^data:/.test(url)) return url;
    return ShopAdmin.api.mediaUrl(url);
  };

  const setMediaPreview = (kind, url, blobUrl) => {
    const img = $(`${kind}-preview`);
    const empty = $(`${kind}-placeholder`);
    if (!img || !empty) return;

    revokeUrl(kind);

    const src = resolvePreviewSrc(url, blobUrl);
    if (!src) {
      img.hidden = true;
      img.removeAttribute('src');
      empty.hidden = false;
      return;
    }

    if (blobUrl) objectUrls[kind] = blobUrl;
    img.src = src;
    img.hidden = false;
    empty.hidden = true;
  };

  const uploadPendingImages = async () => {
    if (imageState.pendingLogoFile) {
      const result = await ShopAdmin.api.uploadFile(imageState.pendingLogoFile, 'settings');
      imageState.logoFileId = pick(result, 'id', 'Id');
      imageState.removedLogo = false;
      imageState.pendingLogoFile = null;
    } else if (imageState.removedLogo) {
      imageState.logoFileId = null;
    }

    if (imageState.pendingFaviconFile) {
      const result = await ShopAdmin.api.uploadFile(imageState.pendingFaviconFile, 'settings');
      imageState.faviconFileId = pick(result, 'id', 'Id');
      imageState.removedFavicon = false;
      imageState.pendingFaviconFile = null;
    } else if (imageState.removedFavicon) {
      imageState.faviconFileId = null;
    }

    if (imageState.pendingOgFile) {
      const result = await ShopAdmin.api.uploadFile(imageState.pendingOgFile, 'settings');
      imageState.ogImageFileId = pick(result, 'id', 'Id');
      imageState.removedOg = false;
      imageState.pendingOgFile = null;
    } else if (imageState.removedOg) {
      imageState.ogImageFileId = null;
    }
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

    imageState.logoFileId = s.logoFileId ?? null;
    imageState.faviconFileId = s.faviconFileId ?? null;
    imageState.ogImageFileId = s.ogImageFileId ?? null;
    imageState.pendingLogoFile = null;
    imageState.pendingFaviconFile = null;
    imageState.pendingOgFile = null;
    imageState.removedLogo = false;
    imageState.removedFavicon = false;
    imageState.removedOg = false;

    syncPublicToggleFromSelect();
    updateSeoPreview();

    setMediaPreview('logo', s.logoUrl, null);
    setMediaPreview('favicon', s.faviconUrl, null);
    setMediaPreview('og', s.ogImageUrl, null);

    if (typeof ShopAdmin.ui.enhanceFormSelects === 'function') {
      ShopAdmin.ui.enhanceFormSelects(document.getElementById('settings-form') || document);
    }
  };

  const collectSettings = () => ({
    shopName: ($('shopName')?.value || '').trim(),
    shopDescription: ($('shopDescription')?.value || '').trim(),
    contactPhone: ($('contactPhone')?.value || '').trim(),
    contactEmail: ($('contactEmail')?.value || '').trim(),
    address: ($('address')?.value || '').trim(),
    currency: ($('currency')?.value || 'تومان').trim(),
    lowStockThreshold: Number($('lowStockThreshold')?.value ?? 10),
    shopVisibility: $('shopVisibility')?.value || 'public',
    instagram: ($('instagram')?.value || '').trim(),
    telegram: ($('telegram')?.value || '').trim(),
    whatsapp: ($('whatsapp')?.value || '').trim(),
    instagramEnabled: !!$('socialInstagramEnabled')?.checked,
    telegramEnabled: !!$('socialTelegramEnabled')?.checked,
    whatsappEnabled: !!$('socialWhatsappEnabled')?.checked,
    defaultSeoTitle: ($('defaultSeoTitle')?.value || '').trim(),
    defaultSeoDescription: ($('defaultSeoDescription')?.value || '').trim(),
    logoFileId: imageState.logoFileId,
    faviconFileId: imageState.faviconFileId,
    ogImageFileId: imageState.ogImageFileId
  });

  const switchTopTab = (tabId) => {
    document.querySelectorAll('[data-settings-tab]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-settings-tab') === tabId);
    });
    document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
      const match = panel.getAttribute('data-tab-panel') === tabId;
      panel.hidden = !match;
      panel.classList.toggle('is-active', match);
    });
    if (tabId === 'banners' && typeof ShopAdmin.settingsBanners?.load === 'function') {
      ShopAdmin.settingsBanners.load();
    }
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

  const bindImageUpload = (inputId, kind, pendingKey, removedKey, fileIdKey) => {
    $(inputId)?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const err = validateImageFile(file);
      if (err) {
        ShopAdmin.ui.showToast('error', err);
        e.target.value = '';
        return;
      }

      imageState[pendingKey] = file;
      imageState[removedKey] = false;
      setMediaPreview(kind, null, URL.createObjectURL(file));
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

    bindImageUpload('logo-upload', 'logo', 'pendingLogoFile', 'removedLogo', 'logoFileId');
    bindImageUpload('favicon-upload', 'favicon', 'pendingFaviconFile', 'removedFavicon', 'faviconFileId');
    bindImageUpload('og-upload', 'og', 'pendingOgFile', 'removedOg', 'ogImageFileId');

    $('logo-remove')?.addEventListener('click', () => {
      imageState.pendingLogoFile = null;
      imageState.logoFileId = null;
      imageState.removedLogo = true;
      setMediaPreview('logo', null, null);
      ShopAdmin.ui.showToast('info', 'لوگو پس از ذخیره حذف می‌شود.');
    });

    $('favicon-remove')?.addEventListener('click', () => {
      imageState.pendingFaviconFile = null;
      imageState.faviconFileId = null;
      imageState.removedFavicon = true;
      setMediaPreview('favicon', null, null);
      ShopAdmin.ui.showToast('info', 'فاویکون پس از ذخیره حذف می‌شود.');
    });

    $('og-remove')?.addEventListener('click', () => {
      imageState.pendingOgFile = null;
      imageState.ogImageFileId = null;
      imageState.removedOg = true;
      setMediaPreview('og', null, null);
      ShopAdmin.ui.showToast('info', 'تصویر OG پس از ذخیره حذف می‌شود.');
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

      try {
        await uploadPendingImages();
        const payload = mapSettingsToApi(collectSettings());
        const saved = await ShopAdmin.api.updateSettings(payload);
        const merged = mapSettingsFromApi(saved);

        imageState.removedLogo = false;
        imageState.removedFavicon = false;
        imageState.removedOg = false;

        setMediaPreview('logo', merged.logoUrl, null);
        setMediaPreview('favicon', merged.faviconUrl, null);
        setMediaPreview('og', merged.ogImageUrl, null);

        const shopNameEl = document.querySelector('[data-shop-name]');
        if (shopNameEl) shopNameEl.textContent = merged.shopName || DEFAULT_SHOP_NAME;

        try {
          await syncPublicBranding(merged);
        } catch (_) { /* ignore branding sync errors */ }

        ShopAdmin.ui.showToast('success', 'تنظیمات سازمان فروش ذخیره شد.');
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'ذخیره تنظیمات ناموفق بود.';
        ShopAdmin.ui.showToast('error', msg);
      }
    });

    form?.addEventListener('reset', async (e) => {
      e.preventDefault();
      await loadSettingsIntoForm();
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

  const loadSettingsIntoForm = async () => {
    try {
      const apiSettings = mapSettingsFromApi(await ShopAdmin.api.getSettings());
      await fillForm(apiSettings);
    } catch {
      await fillForm(mapSettingsFromApi({}));
      ShopAdmin.ui.showToast('warning', 'بارگذاری تنظیمات از API ناموفق — فرم با مقادیر پیش‌فرض نمایش داده شد.');
    }
  };

  const initSettings = async () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'سازمان فروش' }
    ]);

    bindEvents();
    await loadSettingsIntoForm();
    switchTopTab('organization');
    switchOrgPanel('general');
  };

  document.addEventListener('DOMContentLoaded', initSettings);
})(window.ShopAdmin = window.ShopAdmin || {});
