/**
 * settings-banners.js — مدیریت بنرهای صفحه اصلی فروشگاه
 */
(function (ShopAdmin) {
  'use strict';

  const PLACEMENTS = [
    { id: 'HeroSlider', label: 'اسلایدر اصلی (Hero)' },
    { id: 'SideAd', label: 'بنرهای کناری' },
    { id: 'AdRow', label: 'ردیف تبلیغات پایین صفحه' }
  ];

  const pick = (dto, camel, pascal) => dto?.[camel] ?? dto?.[pascal];
  const { validateImageFile } = ShopAdmin.validation;

  let banners = [];
  let editingId = null;
  let pendingImageFile = null;
  let imageFileId = null;
  let objectUrl = null;

  const $ = (id) => document.getElementById(id);

  const placementLabel = (id) => PLACEMENTS.find((p) => p.id === id)?.label || id;

  const revokePreview = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  };

  const showImagePreview = (url, blob) => {
    const img = $('banner-image-preview');
    const empty = $('banner-image-placeholder');
    if (!img || !empty) return;
    revokePreview();
    const src = blob || (url ? ShopAdmin.api.mediaUrl(url) : '');
    if (!src) {
      img.hidden = true;
      empty.hidden = false;
      return;
    }
    if (blob) objectUrl = blob;
    img.src = src;
    img.hidden = false;
    empty.hidden = true;
  };

  const resetForm = () => {
    editingId = null;
    pendingImageFile = null;
    imageFileId = null;
    $('banner-form-title').textContent = 'بنر جدید';
    $('banner-title').value = '';
    $('banner-subtitle').value = '';
    $('banner-button').value = 'مشاهده';
    $('banner-link').value = 'category.html';
    $('banner-placement').value = 'HeroSlider';
    $('banner-sort').value = '0';
    $('banner-active').checked = true;
    $('banner-image-input').value = '';
    showImagePreview(null, null);
  };

  const fillForm = (banner) => {
    editingId = pick(banner, 'id', 'Id');
    pendingImageFile = null;
    imageFileId = pick(banner, 'fileManagerId', 'FileManagerId');
    $('banner-form-title').textContent = 'ویرایش بنر';
    $('banner-title').value = pick(banner, 'title', 'Title') || '';
    $('banner-subtitle').value = pick(banner, 'subtitle', 'Subtitle') || '';
    $('banner-button').value = pick(banner, 'buttonText', 'ButtonText') || '';
    $('banner-link').value = pick(banner, 'linkUrl', 'LinkUrl') || '';
    $('banner-placement').value = pick(banner, 'placement', 'Placement') || 'HeroSlider';
    $('banner-sort').value = String(pick(banner, 'sortOrder', 'SortOrder') ?? 0);
    $('banner-active').checked = pick(banner, 'isActive', 'IsActive') !== false;
    showImagePreview(pick(banner, 'imageUrl', 'ImageUrl') || pick(banner, 'thumbnailUrl', 'ThumbnailUrl'), null);
  };

  const renderList = () => {
    const root = $('banners-list');
    if (!root) return;

    if (!banners.length) {
      root.innerHTML = '<p class="text-muted small mb-0">هنوز بنری ثبت نشده است.</p>';
      return;
    }

    const grouped = PLACEMENTS.map((p) => ({
      ...p,
      items: banners
        .filter((b) => (pick(b, 'placement', 'Placement')) === p.id)
        .sort((a, b) => (pick(a, 'sortOrder', 'SortOrder') || 0) - (pick(b, 'sortOrder', 'SortOrder') || 0))
    }));

    root.innerHTML = grouped.map((group) => {
      if (!group.items.length) return '';
      const cards = group.items.map((b) => {
        const id = pick(b, 'id', 'Id');
        const title = pick(b, 'title', 'Title') || '—';
        const active = pick(b, 'isActive', 'IsActive') !== false;
        const img = ShopAdmin.api.mediaUrl(pick(b, 'thumbnailUrl', 'ThumbnailUrl') || pick(b, 'imageUrl', 'ImageUrl') || '');
        return `
          <div class="settings-card mb-3" data-banner-id="${id}">
            <div class="settings-card__body d-flex gap-3 align-items-center">
              <div class="settings-media-preview settings-media-preview--sm flex-shrink-0" style="width:96px;height:64px;">
                ${img ? `<img src="${img}" alt="" class="settings-media-preview__img" style="object-fit:cover;">` : '<div class="settings-media-preview__empty"><i class="bi bi-image"></i></div>'}
              </div>
              <div class="flex-grow-1">
                <strong>${title}</strong>
                <div class="small text-muted">ترتیب: ${pick(b, 'sortOrder', 'SortOrder') ?? 0} · ${active ? 'فعال' : 'غیرفعال'}</div>
              </div>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-sm btn-outline-primary" data-action="edit-banner" data-id="${id}">ویرایش</button>
                <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete-banner" data-id="${id}">حذف</button>
              </div>
            </div>
          </div>`;
      }).join('');

      return `
        <section class="mb-4">
          <h3 class="h6 mb-2">${group.label}</h3>
          ${cards}
        </section>`;
    }).join('');
  };

  const load = async () => {
    const root = $('banners-admin-root');
    if (!root) return;
    try {
      const data = await ShopAdmin.api.getBannersManage();
      banners = Array.isArray(data) ? data : [];
      renderList();
    } catch (err) {
      ShopAdmin.ui.showToast('error', err?.response?.data?.message || 'بارگذاری بنرها ناموفق بود.');
    }
  };

  const saveBanner = async () => {
    const title = ($('banner-title')?.value || '').trim();
    if (!title) {
      ShopAdmin.ui.showToast('error', 'عنوان بنر الزامی است.');
      return;
    }

    if (pendingImageFile) {
      const uploaded = await ShopAdmin.api.uploadFile(pendingImageFile, 'banners');
      imageFileId = pick(uploaded, 'id', 'Id');
      pendingImageFile = null;
    }

    if (!imageFileId) {
      ShopAdmin.ui.showToast('error', 'تصویر بنر الزامی است.');
      return;
    }

    const body = {
      title,
      subtitle: ($('banner-subtitle')?.value || '').trim() || null,
      buttonText: ($('banner-button')?.value || '').trim() || null,
      linkUrl: ($('banner-link')?.value || '').trim() || null,
      placement: $('banner-placement')?.value || 'HeroSlider',
      sortOrder: Number($('banner-sort')?.value ?? 0),
      isActive: !!$('banner-active')?.checked,
      fileManagerId: imageFileId
    };

    if (editingId) {
      await ShopAdmin.api.updateBanner(editingId, body);
      ShopAdmin.ui.showToast('success', 'بنر به‌روزرسانی شد.');
    } else {
      await ShopAdmin.api.createBanner(body);
      ShopAdmin.ui.showToast('success', 'بنر ایجاد شد.');
    }

    resetForm();
    await load();
  };

  const bindEvents = () => {
    $('banner-image-input')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const err = validateImageFile(file);
      if (err) {
        ShopAdmin.ui.showToast('error', err);
        e.target.value = '';
        return;
      }
      pendingImageFile = file;
      showImagePreview(null, URL.createObjectURL(file));
      e.target.value = '';
    });

    $('banner-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await saveBanner();
      } catch (err) {
        ShopAdmin.ui.showToast('error', err?.response?.data?.message || err?.message || 'ذخیره بنر ناموفق بود.');
      }
    });

    $('banner-form-reset')?.addEventListener('click', () => resetForm());

    $('banners-list')?.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('[data-action="edit-banner"]');
      const deleteBtn = e.target.closest('[data-action="delete-banner"]');
      if (editBtn) {
        const id = Number(editBtn.getAttribute('data-id'));
        const banner = banners.find((b) => pick(b, 'id', 'Id') === id);
        if (banner) {
          try {
            const full = await ShopAdmin.api.getBanner(id);
            fillForm({ ...banner, ...(full || {}) });
          } catch {
            fillForm(banner);
          }
        }
        return;
      }
      if (deleteBtn) {
        const id = Number(deleteBtn.getAttribute('data-id'));
        ShopAdmin.ui.showConfirmModal('حذف بنر', 'این بنر حذف شود؟', async () => {
          try {
            await ShopAdmin.api.deleteBanner(id);
            ShopAdmin.ui.showToast('success', 'بنر حذف شد.');
            if (editingId === id) resetForm();
            await load();
          } catch (err) {
            ShopAdmin.ui.showToast('error', err?.response?.data?.message || 'حذف بنر ناموفق بود.');
          }
        });
      }
    });
  };

  const init = () => {
    if (!$('banners-admin-root')) return;
    bindEvents();
    resetForm();
  };

  document.addEventListener('DOMContentLoaded', init);

  ShopAdmin.settingsBanners = { load };
})(window.ShopAdmin = window.ShopAdmin || {});
