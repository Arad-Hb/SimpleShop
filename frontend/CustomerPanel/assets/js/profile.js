(function (ShopCustomer) {
  'use strict';

  const pick = (dto, camel, pascal) => dto?.[camel] ?? dto?.[pascal];
  const { parseError } = window.SimpleShopHttp || {};
  const apiError = (err) => (parseError ? parseError(err) : (err?.message || 'خطا در ارتباط با سرور.'));

  const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

  let avatarFileId = null;
  let pendingAvatarFile = null;
  let avatarRemoved = false;
  let avatarObjectUrl = null;

  const validateImageFile = (file) => {
    if (!file) return 'فایلی انتخاب نشده است.';
    if (!ALLOWED_IMAGE.includes(file.type)) return 'فرمت تصویر باید JPG، PNG یا WebP باشد.';
    if (file.size > MAX_IMAGE_BYTES) return 'حداکثر حجم تصویر ۵ مگابایت است.';
    return null;
  };

  const showAvatarPreview = (url) => {
    const preview = document.getElementById('avatar-preview');
    const sidebarAvatar = document.querySelector('[data-customer-avatar]');
    const placeholder = document.getElementById('avatar-placeholder');
    const src = url
      ? (/^blob:|^data:/.test(url) ? url : ShopCustomer.api.mediaUrl(url))
      : 'assets/img/customer-avatar.png';

    if (preview) {
      preview.src = src;
      preview.hidden = false;
    }
    if (sidebarAvatar) sidebarAvatar.src = src;
    placeholder?.classList.toggle('d-none', !!url);
  };

  const uploadPendingAvatar = async () => {
    if (pendingAvatarFile) {
      const result = await ShopCustomer.api.uploadFile(pendingAvatarFile, 'users');
      avatarFileId = pick(result, 'id', 'Id');
      avatarRemoved = false;
      pendingAvatarFile = null;
    } else if (avatarRemoved) {
      avatarFileId = null;
    }
  };

  const mapProfile = (dto) => ({
    username: pick(dto, 'username', 'Username') || '',
    firstName: pick(dto, 'firstName', 'FirstName') || '',
    lastName: pick(dto, 'lastName', 'LastName') || '',
    email: pick(dto, 'email', 'Email') || '',
    mobile: pick(dto, 'phone', 'Phone') || pick(dto, 'username', 'Username') || '',
    phone: pick(dto, 'phone', 'Phone') || '',
    nationalId: pick(dto, 'nationalId', 'NationalId') || '',
    postalCode: pick(dto, 'postalCode', 'PostalCode') || '',
    address: pick(dto, 'address', 'Address') || '',
    avatarFileId: pick(dto, 'avatarFileId', 'AvatarFileId') ?? null,
    avatarUrl: pick(dto, 'avatarUrl', 'AvatarUrl') || pick(dto, 'avatarThumbnailUrl', 'AvatarThumbnailUrl') || null
  });

  const fillForm = (profile) => {
    const fields = ['firstName', 'lastName', 'email', 'mobile', 'phone', 'nationalId', 'postalCode', 'address'];
    fields.forEach((key) => {
      const el = document.getElementById(key);
      if (!el) return;
      if (key === 'mobile') el.value = profile.mobile || profile.phone || '';
      else el.value = profile[key] || '';
    });

    const usernameEl = document.getElementById('username');
    if (usernameEl) usernameEl.value = profile.username || ShopCustomer.auth.getSession()?.username || '';

    avatarFileId = profile.avatarFileId;
    avatarRemoved = false;
    pendingAvatarFile = null;
    if (avatarObjectUrl) {
      URL.revokeObjectURL(avatarObjectUrl);
      avatarObjectUrl = null;
    }
    showAvatarPreview(profile.avatarUrl);
  };

  const loadProfile = async () => {
    await ShopCustomer.api.ensureApiAuth();
    try {
      const dto = await ShopCustomer.api.getMyProfile();
      const profile = mapProfile(dto);
      fillForm(profile);
      ShopCustomer.storage.saveProfile(profile);
      return profile;
    } catch (err) {
      const local = ShopCustomer.storage.getProfile() || {};
      fillForm(local);
      ShopCustomer.ui.showToast('warning', apiError(err));
      return local;
    }
  };

  document.addEventListener('DOMContentLoaded', async () => {
    if (!ShopCustomer.auth.requireAuth()) return;

    ShopCustomer.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'پروفایل من' }
    ]);

    await loadProfile();

    document.getElementById('avatar-upload')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const err = validateImageFile(file);
      if (err) {
        ShopCustomer.ui.showToast('error', err);
        e.target.value = '';
        return;
      }
      pendingAvatarFile = file;
      avatarRemoved = false;
      if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
      avatarObjectUrl = URL.createObjectURL(file);
      showAvatarPreview(avatarObjectUrl);
      e.target.value = '';
      ShopCustomer.ui.showToast('success', 'تصویر آماده ذخیره است.');
    });

    document.getElementById('avatar-remove')?.addEventListener('click', () => {
      pendingAvatarFile = null;
      avatarFileId = null;
      avatarRemoved = true;
      if (avatarObjectUrl) {
        URL.revokeObjectURL(avatarObjectUrl);
        avatarObjectUrl = null;
      }
      showAvatarPreview(null);
      ShopCustomer.ui.showToast('info', 'تصویر پس از ذخیره حذف می‌شود.');
    });

    document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      const email = document.getElementById('email').value.trim();
      const mobile = document.getElementById('mobile').value.trim();

      if (!firstName || !lastName || !email || !mobile) {
        ShopCustomer.ui.showToast('error', 'نام، نام خانوادگی، ایمیل و موبایل الزامی است.');
        return;
      }

      try {
        await uploadPendingAvatar();
        const body = {
          firstName,
          lastName,
          email,
          phone: mobile,
          nationalId: document.getElementById('nationalId').value.trim() || null,
          postalCode: document.getElementById('postalCode').value.trim() || null,
          address: document.getElementById('address').value.trim() || null,
          avatarFileId: avatarRemoved ? null : avatarFileId
        };

        const saved = await ShopCustomer.api.updateMyProfile(body);
        const profile = mapProfile(saved);
        ShopCustomer.storage.saveProfile(profile);

        avatarRemoved = false;
        showAvatarPreview(profile.avatarUrl);

        const name = ShopCustomer.utils.fullName(profile);
        document.querySelectorAll('[data-customer-brand], [data-customer-name]').forEach((el) => {
          el.textContent = name;
        });

        ShopCustomer.ui.showToast('success', 'پروفایل ذخیره شد.');
      } catch (err) {
        ShopCustomer.ui.showToast('error', apiError(err));
      }
    });
  });
})(window.ShopCustomer = window.ShopCustomer || {});
