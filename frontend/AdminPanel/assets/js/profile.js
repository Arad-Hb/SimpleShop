/**
 * profile.js — پروفایل مدیر (متصل به API)
 */
(function (ShopAdmin) {
  'use strict';

  const { formatDateTime } = ShopAdmin.utils;
  const { validateRequired, validateEmail, validateMobile, validateForm, validateImageFile } = ShopAdmin.validation;
  const { parseError } = window.SimpleShopHttp || {};
  const apiError = (err) => (parseError ? parseError(err) : (err?.message || 'خطا در ارتباط با سرور.'));

  const pick = (dto, camel, pascal) => dto?.[camel] ?? dto?.[pascal];

  let currentProfile = {};
  let avatarFileId = null;
  let pendingAvatarFile = null;
  let avatarRemoved = false;

  const $ = (id) => document.getElementById(id);

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

  const mapProfile = (dto) => {
    const firstName = pick(dto, 'firstName', 'FirstName') || '';
    const lastName = pick(dto, 'lastName', 'LastName') || '';
    const fullName = `${firstName} ${lastName}`.trim()
      || pick(dto, 'username', 'Username')
      || '';
    return {
      firstName,
      lastName,
      fullName,
      email: pick(dto, 'email', 'Email') || '',
      mobile: pick(dto, 'phone', 'Phone') || pick(dto, 'username', 'Username') || '',
      isActive: pick(dto, 'isActive', 'IsActive') !== false,
      registerDate: pick(dto, 'registerDate', 'RegisterDate') || null,
      avatarFileId: pick(dto, 'avatarFileId', 'AvatarFileId') ?? null,
      avatarUrl: pick(dto, 'avatarUrl', 'AvatarUrl') || pick(dto, 'avatarThumbnailUrl', 'AvatarThumbnailUrl') || null
    };
  };

  const showAvatarPreview = (url) => {
    const preview = $('avatar-preview');
    const placeholder = $('avatar-placeholder');
    if (!url) {
      preview.hidden = true;
      placeholder?.classList.remove('d-none');
      return;
    }
    preview.src = /^blob:|^data:/.test(url) ? url : ShopAdmin.api.mediaUrl(url);
    preview.hidden = false;
    placeholder?.classList.add('d-none');
  };

  const uploadPendingAvatar = async () => {
    if (pendingAvatarFile) {
      const result = await ShopAdmin.api.uploadFile(pendingAvatarFile, 'users');
      avatarFileId = pick(result, 'id', 'Id');
      avatarRemoved = false;
      pendingAvatarFile = null;
    }
  };

  const loadProfile = async () => {
    await ShopAdmin.api.ensureApiAuth();
    const dto = await ShopAdmin.api.getMyProfile();
    currentProfile = mapProfile(dto);
    avatarFileId = currentProfile.avatarFileId;
    avatarRemoved = false;
    pendingAvatarFile = null;
    showAvatarPreview(currentProfile.avatarUrl);

    const session = ShopAdmin.auth.getSession();

    if ($('fullName')) $('fullName').value = currentProfile.fullName;
    if ($('email')) $('email').value = currentProfile.email;
    if ($('mobile')) $('mobile').value = currentProfile.mobile;
    if ($('profileActiveToggle')) {
      $('profileActiveToggle').checked = currentProfile.isActive;
    }
    if ($('lastLogin')) {
      $('lastLogin').value = session?.loggedInAt
        ? formatDateTime(session.loggedInAt)
        : '—';
    }
    if ($('accountCreated')) {
      $('accountCreated').value = currentProfile.registerDate
        ? formatDateTime(currentProfile.registerDate)
        : '—';
    }
  };

  const saveProfile = async (formData) => {
    const parts = formData.fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ');

    await uploadPendingAvatar();

    const payload = {
      firstName,
      lastName,
      email: formData.email,
      phone: formData.mobile,
      avatarFileId: avatarRemoved ? null : avatarFileId
    };

    const updated = await ShopAdmin.api.updateMyProfile(payload);

    currentProfile = {
      ...mapProfile(updated),
      fullName: formData.fullName,
      mobile: formData.mobile
    };
    avatarFileId = currentProfile.avatarFileId;
    showAvatarPreview(currentProfile.avatarUrl);

    ShopAdmin.auth.updateSession({
      fullName: formData.fullName,
      mobile: formData.mobile
    });

    const adminNameEl = document.querySelector('[data-admin-name]');
    if (adminNameEl) adminNameEl.textContent = formData.fullName || 'مدیر';

    ShopAdmin.ui.showToast('success', 'پروفایل با موفقیت ذخیره شد.');
  };

  const changePassword = async () => {
    const currentPassword = $('currentPassword')?.value || '';
    const newPassword = $('newPassword')?.value || '';
    const confirmPassword = $('confirmPassword')?.value || '';

    if (!currentPassword || !newPassword || !confirmPassword) {
      ShopAdmin.ui.showToast('error', 'همه فیلدهای رمز عبور الزامی است.');
      switchTopTab('security');
      switchSecurityPanel('password');
      return;
    }

    if (newPassword.length < 6) {
      ShopAdmin.ui.showToast('error', 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    if (newPassword !== confirmPassword) {
      ShopAdmin.ui.showToast('error', 'رمز عبور جدید و تکرار آن یکسان نیست.');
      return;
    }

    try {
      await ShopAdmin.api.ensureApiAuth();
      await ShopAdmin.api.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      $('currentPassword').value = '';
      $('newPassword').value = '';
      $('confirmPassword').value = '';
      ShopAdmin.ui.showToast('success', 'رمز عبور با موفقیت تغییر کرد.');
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err));
    }
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

      try {
        await saveProfile({
          fullName: form.fullName.value.trim(),
          email: form.email.value.trim(),
          mobile: form.mobile.value.trim()
        });
      } catch (err) {
        ShopAdmin.ui.showToast('error', apiError(err));
      }
    });

    form?.addEventListener('reset', (e) => {
      e.preventDefault();
      loadProfile().then(() => {
        ShopAdmin.ui.showToast('info', 'فرم به آخرین مقادیر ذخیره‌شده برگشت.');
      }).catch((err) => {
        ShopAdmin.ui.showToast('error', apiError(err));
      });
    });

    $('change-password-btn')?.addEventListener('click', () => {
      changePassword();
    });

    $('avatar-upload')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const err = validateImageFile(file);
      if (err) {
        ShopAdmin.ui.showToast('error', err);
        e.target.value = '';
        return;
      }
      pendingAvatarFile = file;
      avatarRemoved = false;
      showAvatarPreview(URL.createObjectURL(file));
      e.target.value = '';
    });

    $('avatar-remove')?.addEventListener('click', () => {
      avatarFileId = null;
      pendingAvatarFile = null;
      avatarRemoved = true;
      showAvatarPreview(null);
    });
  };

  const initProfile = async () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'پروفایل مدیر' }
    ]);

    bindEvents();
    try {
      await loadProfile();
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err));
    }
    switchTopTab('profile');
    switchProfilePanel('personal');
    switchSecurityPanel('account');
  };

  document.addEventListener('DOMContentLoaded', initProfile);
})(window.ShopAdmin = window.ShopAdmin || {});
