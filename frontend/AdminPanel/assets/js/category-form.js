/**
 * category-form.js — فرم ثبت/ویرایش دسته‌بندی
 */
(function (ShopAdmin) {
  'use strict';

  if (!ShopAdmin.auth.requireAuth()) return;

  const { slugify, parseQuery, formatDateTime } = ShopAdmin.utils;
  const {
    validateRequired, validateSlug, validateForm, validateImageFile, showFieldError, clearFieldErrors
  } = ShopAdmin.validation;
  const { parseError } = window.SimpleShopHttp || {};
  const apiError = (err) => (parseError ? parseError(err) : (err?.message || 'خطا در ارتباط با سرور.'));

  const pick = (dto, camel, pascal) => dto?.[camel] ?? dto?.[pascal];

  const form = document.getElementById('category-form');
  if (!form) return;

  const nameInput = document.getElementById('category-name');
  const slugInput = document.getElementById('category-slug');
  const descInput = document.getElementById('category-description');
  const parentSelect = document.getElementById('category-parent');
  const sortInput = document.getElementById('category-sort-order');
  const activeInput = document.getElementById('category-is-active');
  const btnDelete = document.getElementById('btn-delete');
  const btnSave = document.getElementById('btn-save');
  const formHeading = document.getElementById('form-heading');
  const formPageTitle = document.getElementById('form-page-title');
  const tabSystemBtn = document.getElementById('tab-system-btn');
  const dropZone = document.getElementById('image-drop-zone');
  const fileInput = document.getElementById('image-file-input');
  const imagePreviewWrap = document.getElementById('image-preview-wrap');
  const imagePreview = document.getElementById('image-preview');

  const query = parseQuery();
  const editId = query.id ? Number(query.id) : null;
  const isEdit = editId != null && !Number.isNaN(editId);

  let slugManual = false;
  let categoryTree = [];
  let loadedItem = null;
  let isSubmitting = false;
  let imageFileId = null;
  let ogImageId = null;
  let imageRemoved = false;
  let ogImageRemoved = false;
  let pendingImageFile = null;
  let pendingOgFile = null;
  let productCount = 0;
  let childCount = 0;

  const flattenTree = (nodes, depth = 0, out = []) => {
    (nodes || []).forEach((node) => {
      out.push({
        id: pick(node, 'id', 'Id'),
        name: pick(node, 'name', 'Name') || '',
        parentId: pick(node, 'parentId', 'ParentId') ?? null,
        depth: pick(node, 'depth', 'Depth') ?? depth,
        sortOrder: pick(node, 'sortOrder', 'SortOrder') ?? 0,
        isActive: pick(node, 'isActive', 'IsActive') !== false,
        children: pick(node, 'children', 'Children') || []
      });
      flattenTree(pick(node, 'children', 'Children'), depth + 1, out);
    });
    return out;
  };

  const collectDescendantIds = (tree, categoryId) => {
    const flat = flattenTree(tree);
    const byParent = new Map();
    flat.forEach((n) => {
      const pid = n.parentId ?? 0;
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid).push(n.id);
    });

    const blocked = new Set([categoryId]);
    const stack = [categoryId];
    while (stack.length) {
      const current = stack.pop();
      (byParent.get(current) || []).forEach((childId) => {
        if (!blocked.has(childId)) {
          blocked.add(childId);
          stack.push(childId);
        }
      });
    }
    return blocked;
  };

  const mapEditModel = (dto) => ({
    id: pick(dto, 'id', 'Id'),
    name: pick(dto, 'name', 'Name') || '',
    description: pick(dto, 'description', 'Description') || '',
    slug: pick(dto, 'slug', 'Slug') || '',
    parentId: pick(dto, 'parentId', 'ParentId') ?? null,
    sortOrder: pick(dto, 'sortOrder', 'SortOrder') ?? 0,
    depth: pick(dto, 'depth', 'Depth') ?? 0,
    isActive: pick(dto, 'isActive', 'IsActive') !== false,
    metaTitle: pick(dto, 'metaTitle', 'MetaTitle') || '',
    metaDescription: pick(dto, 'metaDescription', 'MetaDescription') || '',
    metaKeywords: pick(dto, 'metaKeywords', 'MetaKeywords') || '',
    canonicalUrl: pick(dto, 'canonicalUrl', 'CanonicalUrl') || '',
    ogTitle: pick(dto, 'ogTitle', 'OgTitle') || '',
    ogDescription: pick(dto, 'ogDescription', 'OgDescription') || '',
    imageFileId: pick(dto, 'imageFileId', 'ImageFileId') ?? null,
    ogImageId: pick(dto, 'ogImageId', 'OgImageId') ?? null,
    imageUrl: pick(dto, 'imageUrl', 'ImageUrl') || pick(dto, 'thumbnailUrl', 'ThumbnailUrl') || '',
    ogImageUrl: pick(dto, 'ogImageUrl', 'OgImageUrl') || '',
    createdAt: pick(dto, 'createdAt', 'CreatedAt') || null,
    productCount: pick(dto, 'productCount', 'ProductCount') ?? 0,
    childCount: pick(dto, 'childCount', 'ChildCount') ?? 0
  });

  const validateSortOrder = (value) => {
    const num = Number(value);
    if (Number.isNaN(num) || num < 0) return 'ترتیب نمایش باید عددی بزرگ‌تر یا مساوی صفر باشد.';
    return null;
  };

  const updateCharCount = (inputId, countId, warnId, minIdeal, maxIdeal) => {
    const el = document.getElementById(inputId);
    const countEl = document.getElementById(countId);
    const warnEl = document.getElementById(warnId);
    if (!el || !countEl) return;
    const len = el.value.length;
    countEl.textContent = len.toLocaleString('fa-IR');
    if (warnEl) {
      warnEl.classList.toggle('d-none', len >= minIdeal && len <= maxIdeal);
    }
  };

  const updateSeoPreview = () => {
    const name = nameInput?.value?.trim() || 'عنوان دسته‌بندی';
    const metaTitle = document.getElementById('metaTitle')?.value?.trim() || name;
    const metaDesc = document.getElementById('metaDescription')?.value?.trim() || 'توضیحات SEO دسته‌بندی...';
    const slug = slugInput?.value?.trim() || slugify(name) || 'slug';
    document.getElementById('seo-preview-title').textContent = metaTitle;
    document.getElementById('seo-preview-url').textContent = `https://shop.example/category/${slug}`;
    document.getElementById('seo-preview-desc').textContent = metaDesc;
  };

  const setTabError = (tab, hasError) => {
    const btn = document.querySelector(`#category-tabs [data-tab="${tab}"]`);
    btn?.classList.toggle('text-danger', hasError);
  };

  const showImagePreview = (url) => {
    if (!url) {
      imagePreviewWrap?.classList.add('d-none');
      return;
    }
    imagePreview.src = ShopAdmin.api.mediaUrl(url);
    imagePreviewWrap?.classList.remove('d-none');
  };

  const uploadPendingFiles = async () => {
    if (pendingImageFile) {
      const result = await ShopAdmin.api.uploadFile(pendingImageFile, 'categories');
      imageFileId = pick(result, 'id', 'Id');
      imageRemoved = false;
      pendingImageFile = null;
    }
    if (pendingOgFile) {
      const result = await ShopAdmin.api.uploadFile(pendingOgFile, 'categories');
      ogImageId = pick(result, 'id', 'Id');
      ogImageRemoved = false;
      pendingOgFile = null;
    }
  };

  const buildPayload = (confirmShiftSortOrder = false) => {
    const sortVal = Number(sortInput.value);
    return {
      name: nameInput.value.trim(),
      slug: slugInput.value.trim() || slugify(nameInput.value) || null,
      description: descInput.value.trim() || null,
      parentId: parentSelect.value ? Number(parentSelect.value) : null,
      sortOrder: Number.isNaN(sortVal) || sortVal <= 0 ? 0 : sortVal,
      isActive: activeInput.checked,
      confirmShiftSortOrder,
      metaTitle: document.getElementById('metaTitle')?.value?.trim() || null,
      metaDescription: document.getElementById('metaDescription')?.value?.trim() || null,
      metaKeywords: document.getElementById('keywords')?.value?.trim() || null,
      canonicalUrl: document.getElementById('canonicalUrl')?.value?.trim() || null,
      ogTitle: document.getElementById('ogTitle')?.value?.trim() || null,
      ogDescription: document.getElementById('ogDescription')?.value?.trim() || null,
      imageFileId: imageRemoved ? null : imageFileId,
      ogImageId: ogImageRemoved ? null : ogImageId
    };
  };

  const setSubmitting = (loading) => {
    isSubmitting = loading;
    btnSave.disabled = loading;
    btnSave.querySelector('.submit-text')?.classList.toggle('d-none', loading);
    btnSave.querySelector('.spinner-border')?.classList.toggle('d-none', !loading);
  };

  const submitPayload = async (payload) => {
    if (isSubmitting) return;
    setSubmitting(true);

    try {
      await ShopAdmin.api.ensureApiAuth();
      await uploadPendingFiles();
      const finalPayload = buildPayload(payload.confirmShiftSortOrder);
      if (isEdit) await ShopAdmin.api.updateCategory(editId, finalPayload);
      else await ShopAdmin.api.createCategory(finalPayload);

      ShopAdmin.ui.showToast('success', isEdit ? 'دسته‌بندی به‌روزرسانی شد.' : 'دسته‌بندی جدید ثبت شد.');
      window.location.href = 'categories.html';
    } catch (err) {
      if (ShopAdmin.api.isSortOrderConflict(err)) {
        const conflict = ShopAdmin.api.getSortOrderConflict(err);
        ShopAdmin.ui.showConfirmModal(
          'تأیید جابجایی ترتیب',
          conflict?.message || 'قرار دادن در این موقعیت باعث جابجایی SortOrder سایر دسته‌های هم‌سطح می‌شود. تأیید می‌کنید؟',
          () => submitPayload({ ...payload, confirmShiftSortOrder: true })
        );
      } else {
        ShopAdmin.ui.showToast('error', apiError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const validateAll = () => {
    clearFieldErrors(form);
    const errors = { main: [], image: [], seo: [] };

    const { valid, errors: formErrors } = validateForm(form, [
      { name: 'name', label: 'نام', rules: [(v) => validateRequired(v, 'نام')] },
      { name: 'sortOrder', label: 'ترتیب نمایش', rules: [(v) => validateSortOrder(v)] }
    ]);

    if (!valid) errors.main.push(...formErrors);

    const slugErr = validateSlug(slugInput?.value || slugify(nameInput?.value || ''));
    if (slugErr) {
      errors.seo.push(slugErr);
      showFieldError(slugInput, slugErr);
    }

    setTabError('main', errors.main.length > 0);
    setTabError('image', errors.image.length > 0);
    setTabError('seo', errors.seo.length > 0);

    const allErrors = [...errors.main, ...errors.image, ...errors.seo];
    if (allErrors.length) {
      if (errors.seo.length) document.getElementById('tab-seo-btn')?.click();
      else if (errors.main.length) document.getElementById('tab-main-btn')?.click();
      return false;
    }
    return true;
  };

  const populateParentOptions = (excludeIds = new Set()) => {
    if (!parentSelect) return;
    const current = parentSelect.value;
    parentSelect.innerHTML = '<option value="">— بدون والد (ریشه) —</option>';

    flattenTree(categoryTree)
      .filter((n) => !excludeIds.has(n.id) && n.depth < 3)
      .sort((a, b) => a.depth - b.depth || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'fa'))
      .forEach((n) => {
        const opt = document.createElement('option');
        opt.value = n.id;
        opt.textContent = `${'— '.repeat(n.depth)}${n.name}${n.isActive ? '' : ' (غیرفعال)'}`;
        parentSelect.appendChild(opt);
      });

    if (current) parentSelect.value = current;
  };

  const handleImageFile = (file) => {
    const err = validateImageFile(file);
    if (err) {
      ShopAdmin.ui.showToast('error', err);
      return;
    }
    pendingImageFile = file;
    imageRemoved = false;
    const url = URL.createObjectURL(file);
    showImagePreview(url);
  };

  const initImageDropZone = () => {
    dropZone?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput?.click();
      }
    });
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handleImageFile(file);
      e.target.value = '';
    });
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drop-zone--active');
    });
    dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drop-zone--active'));
    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drop-zone--active');
      const file = e.dataTransfer?.files?.[0];
      if (file) handleImageFile(file);
    });
    document.getElementById('btn-remove-image')?.addEventListener('click', () => {
      imageFileId = null;
      pendingImageFile = null;
      imageRemoved = true;
      imagePreviewWrap?.classList.add('d-none');
    });
  };

  const loadForm = async () => {
    try {
      await ShopAdmin.api.ensureApiAuth();
      categoryTree = await ShopAdmin.api.getCategoriesTree();

      if (isEdit) {
        const dto = await ShopAdmin.api.getCategory(editId);
        loadedItem = mapEditModel(dto);

        if (!loadedItem.id) {
          ShopAdmin.ui.showToast('error', 'دسته‌بندی یافت نشد.');
          setTimeout(() => { window.location.href = 'categories.html'; }, 1500);
          return;
        }

        productCount = loadedItem.productCount;
        childCount = loadedItem.childCount;
        imageFileId = loadedItem.imageFileId;
        ogImageId = loadedItem.ogImageId;

        const exclude = collectDescendantIds(categoryTree, editId);
        populateParentOptions(exclude);

        document.getElementById('category-id').value = loadedItem.id;
        nameInput.value = loadedItem.name;
        slugInput.value = loadedItem.slug || '';
        descInput.value = loadedItem.description || '';
        sortInput.value = loadedItem.sortOrder ?? 0;
        activeInput.checked = loadedItem.isActive;
        if (loadedItem.parentId) parentSelect.value = String(loadedItem.parentId);

        document.getElementById('metaTitle').value = loadedItem.metaTitle || '';
        document.getElementById('metaDescription').value = loadedItem.metaDescription || '';
        document.getElementById('keywords').value = loadedItem.metaKeywords || '';
        document.getElementById('canonicalUrl').value = loadedItem.canonicalUrl || '';
        document.getElementById('ogTitle').value = loadedItem.ogTitle || '';
        document.getElementById('ogDescription').value = loadedItem.ogDescription || '';

        document.getElementById('sys-id').value = loadedItem.id.toLocaleString('fa-IR');
        document.getElementById('sys-depth').value = loadedItem.depth.toLocaleString('fa-IR');
        document.getElementById('sys-productCount').value = productCount.toLocaleString('fa-IR');
        document.getElementById('sys-childCount').value = childCount.toLocaleString('fa-IR');
        document.getElementById('sys-createdAt').value = loadedItem.createdAt
          ? formatDateTime(loadedItem.createdAt) : '—';

        tabSystemBtn?.classList.remove('d-none');
        btnDelete?.classList.remove('d-none');

        formHeading.textContent = 'ویرایش دسته‌بندی';
        formPageTitle.textContent = 'ویرایش دسته‌بندی';
        document.title = 'ویرایش دسته‌بندی — پنل مدیریت فروشگاه';

        if (loadedItem.slug) slugManual = true;
        if (loadedItem.imageUrl) showImagePreview(loadedItem.imageUrl);
        if (loadedItem.ogImageUrl) {
          document.getElementById('og-image-preview').innerHTML =
            `<img src="${ShopAdmin.api.mediaUrl(loadedItem.ogImageUrl)}" class="img-thumbnail" style="max-height:80px" alt="OG">`;
        }
      } else {
        populateParentOptions();
      }

      updateSeoPreview();
      updateCharCount('metaTitle', 'metaTitle-count', 'metaTitle-warn', 30, 60);
      updateCharCount('metaDescription', 'metaDescription-count', 'metaDescription-warn', 120, 160);
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err));
    }
  };

  const handleDelete = () => {
    if (productCount > 0) {
      ShopAdmin.ui.showToast('warning', `این دسته‌بندی ${productCount.toLocaleString('fa-IR')} محصول دارد و قابل حذف نیست.`);
      return;
    }
    if (childCount > 0) {
      ShopAdmin.ui.showToast('warning', 'ابتدا زیردسته‌های این دسته را حذف یا منتقل کنید.');
      return;
    }

    ShopAdmin.ui.showConfirmModal(
      'حذف دسته‌بندی',
      `آیا از حذف «${loadedItem?.name || ''}» اطمینان دارید؟`,
      async () => {
        try {
          await ShopAdmin.api.ensureApiAuth();
          await ShopAdmin.api.deleteCategory(editId);
          ShopAdmin.ui.showToast('success', 'دسته‌بندی حذف شد.');
          window.location.href = 'categories.html';
        } catch (err) {
          ShopAdmin.ui.showToast('error', apiError(err));
        }
      }
    );
  };

  ShopAdmin.ui.initBreadcrumb([
    { label: 'داشبورد', href: 'index.html' },
    { label: 'دسته‌بندی‌ها', href: 'categories.html' },
    { label: isEdit ? 'ویرایش' : 'افزودن' }
  ]);

  initImageDropZone();

  slugInput?.addEventListener('input', () => {
    slugManual = slugInput.value.trim().length > 0;
    updateSeoPreview();
  });

  nameInput?.addEventListener('input', () => {
    if (!slugManual && slugInput) slugInput.value = slugify(nameInput.value);
    updateSeoPreview();
  });

  ['metaTitle', 'metaDescription', 'ogTitle', 'ogDescription', 'keywords', 'canonicalUrl'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => {
      updateSeoPreview();
      if (id === 'metaTitle') updateCharCount('metaTitle', 'metaTitle-count', 'metaTitle-warn', 30, 60);
      if (id === 'metaDescription') updateCharCount('metaDescription', 'metaDescription-count', 'metaDescription-warn', 120, 160);
    });
  });

  document.getElementById('ogImageFile')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { ShopAdmin.ui.showToast('error', err); return; }
    pendingOgFile = file;
    ogImageRemoved = false;
    const url = URL.createObjectURL(file);
    document.getElementById('og-image-preview').innerHTML =
      `<img src="${url}" class="img-thumbnail" style="max-height:80px" alt="OG">`;
    e.target.value = '';
  });

  btnDelete?.addEventListener('click', handleDelete);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateAll()) {
      ShopAdmin.ui.showToast('error', 'لطفاً خطاهای فرم را برطرف کنید.');
      return;
    }
    submitPayload(buildPayload(false));
  });

  loadForm();
})(window.ShopAdmin = window.ShopAdmin || {});
