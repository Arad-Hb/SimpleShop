/**
 * profile.js — پروفایل مدیر (همان الگوی سازمان فروش)
 */
(function (ShopAdmin) {
  'use strict';

  const { formatDateTime, generateId } = ShopAdmin.utils;
  const { validateRequired, validateEmail, validateMobile, validateForm } = ShopAdmin.validation;
  const { imageStore, getData, saveData } = ShopAdmin.storage;

  let currentProfile = {};
  let avatarUrl = null;
  let pendingAvatarId = null;
  let avatarRemoved = false;

  const $ = (id) => document.getElementById(id);

  const setAvatarPreview = async (avatarId) => {
    const preview = $('avatar-preview');
    const placeholder = $('avatar-placeholder');
    if (!preview || !placeholder) return;

    if (avatarUrl) {
      URL.revokeObjectURL(avatarUrl);
      avatarUrl = null;
    }

    if (!avatarId) {
      preview.hidden = true;
      preview.removeAttribute('src');
      placeholder.hidden = false;
      return;
    }

    const blob = await imageStore.getImage(avatarId);
    if (!blob) {
      preview.hidden = true;
      placeholder.hidden = false;
      return;
    }

    avatarUrl = URL.createObjectURL(blob);
    preview.src = avatarUrl;
    preview.hidden = false;
    placeholder.hidden = true;
  };

  const switchTopTab = (tabId) => {
    document.querySelectorAll('[data-profile-tab]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-profile-tab') === tabId);
    });
    document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
      const match = panel.getAttribute('data-tab-panel') === tabId;
      panel.hidden = !match;
      panel.classList.toggle('is-active', match);
    });
  };

  const switchProfilePanel = (panelId) => {
    document.querySelectorAll('[data-profile-panel]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-profile-panel') === panelId);
    });
    document.querySelectorAll('[data-profile-content]').forEach((panel) => {
      const match = panel.getAttribute('data-profile-content') === panelId;
      panel.hidden = !match;
      panel.classList.toggle('is-active', match);
    });
  };

  const switchSecurityPanel = (panelId) => {
    document.querySelectorAll('[data-security-panel]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-security-panel') === panelId);
    });
    document.querySelectorAll('[data-security-content]').forEach((panel) => {
      const match = panel.getAttribute('data-security-content') === panelId;
      panel.hidden = !match;
      panel.classList.toggle('is-active', match);
    });
  };

  const loadProfile = async () => {
    currentProfile = { ...(getData().adminProfile || {}) };
    pendingAvatarId = currentProfile.avatarId || null;
    avatarRemoved = false;

    const session = ShopAdmin.auth.getSession();

    if ($('fullName')) $('fullName').value = currentProfile.fullName || '';
    if ($('email')) $('email').value = currentProfile.email || '';
    if ($('mobile')) $('mobile').value = currentProfile.mobile || '';
    if ($('profileActiveToggle')) {
      $('profileActiveToggle').checked = currentProfile.isActive !== false;
    }
    if ($('lastLogin')) {
      $('lastLogin').value = session?.loggedInAt
        ? formatDateTime(session.loggedInAt)
        : (currentProfile.lastLogin ? formatDateTime(currentProfile.lastLogin) : '—');
    }
    if ($('accountCreated')) {
      $('accountCreated').value = currentProfile.createdAt
        ? formatDateTime(currentProfile.createdAt)
        : '—';
    }

    await setAvatarPreview(pendingAvatarId);
  };

  const saveProfile = async (formData) => {
    const data = getData();
    const prev = data.adminProfile || {};
    const nextAvatarId = avatarRemoved ? null : (pendingAvatarId ?? prev.avatarId ?? null);

    if (prev.avatarId && prev.avatarId !== nextAvatarId) {
      await imageStore.deleteImage(prev.avatarId).catch(() => {});
    }

    data.adminProfile = {
      ...prev,
      fullName: formData.fullName,
      email: formData.email,
      mobile: formData.mobile,
      isActive: formData.isActive,
      avatarId: nextAvatarId,
      updatedAt: new Date().toISOString()
    };
    saveData(data);

    currentProfile = data.adminProfile;
    pendingAvatarId = nextAvatarId;
    avatarRemoved = false;

    const adminNameEl = document.querySelector('[data-admin-name]');
    if (adminNameEl) adminNameEl.textContent = data.adminProfile.fullName || 'مدیر';

    ShopAdmin.ui.showToast('success', 'پروفایل با موفقیت ذخیره شد.');
  };

  const bindNavigation = () => {
    document.querySelectorAll('[data-profile-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchTopTab(btn.getAttribute('data-profile-tab'));
      });
    });

    document.querySelectorAll('[data-profile-panel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchProfilePanel(btn.getAttribute('data-profile-panel'));
      });
    });

    document.querySelectorAll('[data-security-panel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchSecurityPanel(btn.getAttribute('data-security-panel'));
      });
    });
  };

  const bindEvents = () => {
    bindNavigation();

    const form = $('profile-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const result = validateForm(form, [
        { name: 'fullName', label: 'نام کامل', rules: [validateRequired] },
        { name: 'email', label: 'ایمیل', rules: [validateRequired, validateEmail] },
        { name: 'mobile', rules: [validateMobile] }
      ]);

      if (!result.valid) {
        switchTopTab('profile');
        switchProfilePanel('personal');
        $('fullName')?.focus();
        return;
      }

      await saveProfile({
        fullName: form.fullName.value.trim(),
        email: form.email.value.trim(),
        mobile: form.mobile.value.trim(),
        isActive: !!$('profileActiveToggle')?.checked
      });
    });

    form?.addEventListener('reset', (e) => {
      e.preventDefault();
      loadProfile();
      ShopAdmin.ui.showToast('info', 'فرم به آخرین مقادیر ذخیره‌شده برگشت.');
    });

    $('avatar-upload')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const err = ShopAdmin.validation.validateImageFile(file);
      if (err) {
        ShopAdmin.ui.showToast('error', err);
        e.target.value = '';
        return;
      }

      const savedId = getData().adminProfile?.avatarId || null;
      const oldPending = pendingAvatarId;
      const newId = generateId('avatar');
      await imageStore.saveImage(newId, file);

      if (oldPending && oldPending !== savedId && oldPending !== newId) {
        await imageStore.deleteImage(oldPending).catch(() => {});
      }

      pendingAvatarId = newId;
      avatarRemoved = false;
      await setAvatarPreview(newId);
      e.target.value = '';
      ShopAdmin.ui.showToast('success', 'آواتار آماده ذخیره است.');
    });

    $('avatar-remove')?.addEventListener('click', async () => {
      pendingAvatarId = null;
      avatarRemoved = true;
      await setAvatarPreview(null);
      ShopAdmin.ui.showToast('info', 'آواتار پس از ذخیره حذف می‌شود.');
    });
  };

  const initProfile = async () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'پروفایل مدیر' }
    ]);

    bindEvents();
    await loadProfile();
    switchTopTab('profile');
    switchProfilePanel('personal');
    switchSecurityPanel('account');
  };

  document.addEventListener('DOMContentLoaded', initProfile);
})(window.ShopAdmin = window.ShopAdmin || {});
