/**
 * settings.js — تنظیمات فروشگاه
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml, generateId } = ShopAdmin.utils;
  const { validateRequired, validateEmail, validatePhone, validateImageFile, validateForm } = ShopAdmin.validation;
  const { imageStore, getData, saveData, STORAGE_KEY } = ShopAdmin.storage;

  let currentSettings = {};
  let imageUrls = {};

  const setImagePreview = async (previewId, placeholderId, imageId) => {
    const preview = document.getElementById(previewId);
    const placeholder = document.getElementById(placeholderId);
    if (!preview || !placeholder) return;

    if (imageUrls[previewId]) {
      URL.revokeObjectURL(imageUrls[previewId]);
      delete imageUrls[previewId];
    }

    if (!imageId) {
      preview.style.display = 'none';
      preview.src = '';
      placeholder.style.display = '';
      return;
    }

    const blob = await imageStore.getImage(imageId);
    if (!blob) {
      preview.style.display = 'none';
      placeholder.style.display = '';
      return;
    }

    const url = URL.createObjectURL(blob);
    imageUrls[previewId] = url;
    preview.src = url;
    preview.style.display = '';
    placeholder.style.display = 'none';
  };

  const loadSettings = async () => {
    currentSettings = getData().settings || {};
    const form = document.getElementById('settings-form');
    if (!form) return;

    form.shopName.value = currentSettings.shopName || '';
    form.shopDescription.value = currentSettings.shopDescription || '';
    form.contactPhone.value = currentSettings.contactPhone || '';
    form.contactEmail.value = currentSettings.contactEmail || '';
    form.address.value = currentSettings.address || '';
    form.currency.value = currentSettings.currency || 'تومان';
    form.lowStockThreshold.value = currentSettings.lowStockThreshold ?? 10;
    form.shopVisibility.value = currentSettings.shopVisibility || 'public';
    form.defaultSeoTitle.value = currentSettings.defaultSeoTitle || '';
    form.defaultSeoDescription.value = currentSettings.defaultSeoDescription || '';

    await setImagePreview('logo-preview', 'logo-placeholder', currentSettings.logoId);
    await setImagePreview('favicon-preview', 'favicon-placeholder', currentSettings.faviconId);
    await setImagePreview('og-preview', 'og-placeholder', currentSettings.ogImageId);

    updateSeoPreview();
  };

  const updateSeoPreview = () => {
    const title = document.getElementById('defaultSeoTitle')?.value || document.getElementById('shopName')?.value || 'عنوان صفحه';
    const desc = document.getElementById('defaultSeoDescription')?.value || document.getElementById('shopDescription')?.value || 'توضیحات متا...';
    const titleEl = document.getElementById('seo-preview-title');
    const descEl = document.getElementById('seo-preview-desc');
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
  };

  const handleImageUpload = (inputId, fieldKey, previewId, placeholderId) => {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;

      const err = validateImageFile(file);
      if (err) {
        ShopAdmin.ui.showToast('error', err);
        input.value = '';
        return;
      }

      const oldId = currentSettings[fieldKey];
      const newId = generateId('img');
      await imageStore.saveImage(newId, file);

      if (oldId) await imageStore.deleteImage(oldId).catch(() => {});

      currentSettings[fieldKey] = newId;
      await setImagePreview(previewId, placeholderId, newId);
      ShopAdmin.ui.showToast('success', 'تصویر بارگذاری شد. برای ذخیره نهایی دکمه ذخیره را بزنید.');
      input.value = '';
    });
  };

  const removeImage = async (fieldKey, previewId, placeholderId, inputId) => {
    const oldId = currentSettings[fieldKey];
    if (oldId) {
      await imageStore.deleteImage(oldId).catch(() => {});
    }
    currentSettings[fieldKey] = null;
    await setImagePreview(previewId, placeholderId, null);
    const input = document.getElementById(inputId);
    if (input) input.value = '';
  };

  const saveSettings = (formData) => {
    const data = getData();
    data.settings = {
      ...data.settings,
      ...currentSettings,
      shopName: formData.shopName,
      shopDescription: formData.shopDescription,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      address: formData.address,
      currency: formData.currency,
      lowStockThreshold: Number(formData.lowStockThreshold) || 10,
      shopVisibility: formData.shopVisibility,
      defaultSeoTitle: formData.defaultSeoTitle,
      defaultSeoDescription: formData.defaultSeoDescription
    };
    saveData(data);
    currentSettings = data.settings;

    const shopNameEl = document.querySelector('[data-shop-name]');
    if (shopNameEl) shopNameEl.textContent = data.settings.shopName || 'فروشگاه';

    ShopAdmin.ui.showToast('success', 'تنظیمات با موفقیت ذخیره شد.');
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    ShopAdmin.seed.seedDemoData();
    window.location.reload();
  };

  const bindEvents = () => {
    document.getElementById('settings-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.target;

      const result = validateForm(form, [
        { name: 'shopName', label: 'نام فروشگاه', rules: [validateRequired] },
        { name: 'contactEmail', rules: [validateEmail] },
        { name: 'contactPhone', rules: [validatePhone] }
      ]);

      if (!result.valid) return;

      saveSettings({
        shopName: form.shopName.value.trim(),
        shopDescription: form.shopDescription.value.trim(),
        contactPhone: form.contactPhone.value.trim(),
        contactEmail: form.contactEmail.value.trim(),
        address: form.address.value.trim(),
        currency: form.currency.value.trim() || 'تومان',
        lowStockThreshold: form.lowStockThreshold.value,
        shopVisibility: form.shopVisibility.value,
        defaultSeoTitle: form.defaultSeoTitle.value.trim(),
        defaultSeoDescription: form.defaultSeoDescription.value.trim()
      });
    });

    document.getElementById('settings-form')?.addEventListener('reset', (e) => {
      e.preventDefault();
      loadSettings();
    });

    ['defaultSeoTitle', 'defaultSeoDescription', 'shopName', 'shopDescription'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', updateSeoPreview);
    });

    handleImageUpload('logo-upload', 'logoId', 'logo-preview', 'logo-placeholder');
    handleImageUpload('favicon-upload', 'faviconId', 'favicon-preview', 'favicon-placeholder');
    handleImageUpload('og-upload', 'ogImageId', 'og-preview', 'og-placeholder');

    document.getElementById('logo-remove')?.addEventListener('click', () => {
      removeImage('logoId', 'logo-preview', 'logo-placeholder', 'logo-upload');
    });

    document.getElementById('btn-reset-demo')?.addEventListener('click', () => {
      ShopAdmin.ui.showConfirmModal(
        'بازنشانی داده‌های دمو',
        'تمام داده‌های فعلی پاک شده و داده‌های نمونه مجدداً بارگذاری می‌شوند. ادامه می‌دهید؟',
        resetDemoData
      );
    });
  };

  const initSettings = async () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'تنظیمات فروشگاه' }
    ]);

    await loadSettings();
    bindEvents();
  };

  document.addEventListener('DOMContentLoaded', initSettings);
})(window.ShopAdmin = window.ShopAdmin || {});
