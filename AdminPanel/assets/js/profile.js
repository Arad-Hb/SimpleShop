/**
 * profile.js — پروفایل مدیر
 */
(function (ShopAdmin) {
  'use strict';

  const { formatDateTime, generateId } = ShopAdmin.utils;
  const { validateRequired, validateEmail, validateMobile, validateForm } = ShopAdmin.validation;
  const { imageStore, getData, saveData } = ShopAdmin.storage;

  let currentProfile = {};
  let avatarUrl = null;

  const setAvatarPreview = async (avatarId) => {
    const preview = document.getElementById('avatar-preview');
    const placeholder = document.getElementById('avatar-placeholder');
    if (!preview || !placeholder) return;

    if (avatarUrl) {
      URL.revokeObjectURL(avatarUrl);
      avatarUrl = null;
    }

    if (!avatarId) {
      preview.style.display = 'none';
      placeholder.style.display = '';
      return;
    }

    const blob = await imageStore.getImage(avatarId);
    if (!blob) {
      preview.style.display = 'none';
      placeholder.style.display = '';
      return;
    }

    avatarUrl = URL.createObjectURL(blob);
    preview.src = avatarUrl;
    preview.style.display = '';
    placeholder.style.display = 'none';
  };

  const loadProfile = async () => {
    currentProfile = getData().adminProfile || {};
    const session = ShopAdmin.auth.getSession();

    document.getElementById('fullName').value = currentProfile.fullName || '';
    document.getElementById('email').value = currentProfile.email || '';
    document.getElementById('mobile').value = currentProfile.mobile || '';
    document.getElementById('lastLogin').value = session?.loggedInAt
      ? formatDateTime(session.loggedInAt)
      : (currentProfile.lastLogin ? formatDateTime(currentProfile.lastLogin) : '—');
    document.getElementById('accountCreated').value = currentProfile.createdAt
      ? formatDateTime(currentProfile.createdAt)
      : '—';

    await setAvatarPreview(currentProfile.avatarId);
  };

  const saveProfile = (formData) => {
    const data = getData();
    data.adminProfile = {
      ...data.adminProfile,
      fullName: formData.fullName,
      email: formData.email,
      mobile: formData.mobile,
      avatarId: currentProfile.avatarId ?? data.adminProfile.avatarId
    };
    saveData(data);
    currentProfile = data.adminProfile;

    const adminNameEl = document.querySelector('[data-admin-name]');
    if (adminNameEl) adminNameEl.textContent = data.adminProfile.fullName || 'مدیر';

    ShopAdmin.ui.showToast('success', 'پروفایل با موفقیت ذخیره شد.');
  };

  const bindEvents = () => {
    document.getElementById('profile-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.target;

      const result = validateForm(form, [
        { name: 'fullName', label: 'نام کامل', rules: [validateRequired] },
        { name: 'email', label: 'ایمیل', rules: [validateRequired, validateEmail] },
        { name: 'mobile', rules: [validateMobile] }
      ]);

      if (!result.valid) return;

      saveProfile({
        fullName: form.fullName.value.trim(),
        email: form.email.value.trim(),
        mobile: form.mobile.value.trim()
      });
    });

    document.getElementById('avatar-upload')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const err = ShopAdmin.validation.validateImageFile(file);
      if (err) {
        ShopAdmin.ui.showToast('error', err);
        e.target.value = '';
        return;
      }

      const oldId = currentProfile.avatarId;
      const newId = generateId('avatar');
      await imageStore.saveImage(newId, file);
      if (oldId) await imageStore.deleteImage(oldId).catch(() => {});

      currentProfile.avatarId = newId;
      await setAvatarPreview(newId);

      const data = getData();
      data.adminProfile.avatarId = newId;
      saveData(data);

      ShopAdmin.ui.showToast('success', 'آواتار به‌روزرسانی شد.');
      e.target.value = '';
    });

    document.getElementById('avatar-remove')?.addEventListener('click', async () => {
      const oldId = currentProfile.avatarId;
      if (oldId) await imageStore.deleteImage(oldId).catch(() => {});
      currentProfile.avatarId = null;

      const data = getData();
      data.adminProfile.avatarId = null;
      saveData(data);

      await setAvatarPreview(null);
      ShopAdmin.ui.showToast('success', 'آواتار حذف شد.');
    });
  };

  const initProfile = async () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'پروفایل مدیر' }
    ]);

    await loadProfile();
    bindEvents();
  };

  document.addEventListener('DOMContentLoaded', initProfile);
})(window.ShopAdmin = window.ShopAdmin || {});
