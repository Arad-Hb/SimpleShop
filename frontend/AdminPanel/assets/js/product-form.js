/**
 * product-form.js — فرم ثبت/ویرایش محصول
 */
(function (ShopAdmin) {
  'use strict';

  if (!ShopAdmin.auth.requireAuth()) return;

  const {
    escapeHtml, slugify, formatDateTime
  } = ShopAdmin.utils;
  const {
    validateRequired, validateSlug, validateImageFile, showFieldError, clearFieldErrors
  } = ShopAdmin.validation;
  const { parseError } = window.SimpleShopHttp || {};
  const apiError = (err) => (parseError ? parseError(err) : (err?.message || 'خطا در ارتباط با سرور.'));

  const pick = (dto, camel, pascal) => dto?.[camel] ?? dto?.[pascal];

  const form = document.getElementById('product-form');
  const dropZone = document.getElementById('image-drop-zone');
  const fileInput = document.getElementById('image-file-input');
  const imagePreviewWrap = document.getElementById('image-preview-wrap');
  const imagePreview = document.getElementById('image-preview');
  const ogImagePreview = document.getElementById('og-image-preview');

  let editId = null;
  let slugManual = false;
  let isDirty = false;
  let isSubmitting = false;
  let primaryImageId = null;
  let ogImageId = null;
  let imageRemoved = false;
  let ogImageRemoved = false;
  let pendingImageFile = null;
  let pendingOgFile = null;

  const defaultSeo = () => ({
    metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '',
    ogTitle: '', ogDescription: '', index: true, follow: true
  });

  const toApiPayload = (data) => ({
    name: data.name,
    description: data.description || null,
    price: Number(data.price) || 0,
    stock: Number(data.stock) || 0,
    isActive: data.isActive !== false,
    minimumStock: Number(data.minimumStock) || 0,
    categoryId: Number(data.categoryId),
    supplierId: data.supplierId ? Number(data.supplierId) : null,
    slug: data.slug || null,
    metaTitle: data.seo?.metaTitle || null,
    metaDescription: data.seo?.metaDescription || null,
    metaKeywords: data.seo?.keywords || null,
    canonicalUrl: data.seo?.canonicalUrl || null,
    ogTitle: data.seo?.ogTitle || null,
    ogDescription: data.seo?.ogDescription || null,
    primaryImageId: imageRemoved ? null : primaryImageId,
    ogImageId: ogImageRemoved ? null : ogImageId
  });

  const isAssignableProductCategory = (c) => {
    const depth = Number(pick(c, 'depth', 'Depth') ?? 0);
    const parentId = pick(c, 'parentId', 'ParentId');
    return depth === 2 && parentId != null && parentId !== '';
  };

  const shouldShowInCategoryDropdown = (c, includeCategoryId = null) => {
    const id = pick(c, 'id', 'Id');
    if (includeCategoryId != null && Number(id) === Number(includeCategoryId)) return true;
    return isAssignableProductCategory(c);
  };

  const appendCategoryOptions = (categories, catSel, includeCategoryId = null) => {
    (Array.isArray(categories) ? categories : [])
      .filter((c) => shouldShowInCategoryDropdown(c, includeCategoryId))
      .sort((a, b) => (pick(a, 'sortOrder', 'SortOrder') || 0) - (pick(b, 'sortOrder', 'SortOrder') || 0))
      .forEach((c) => {
        const opt = document.createElement('option');
        opt.value = pick(c, 'id', 'Id');
        opt.textContent = `${pick(c, 'name', 'Name') || ''}${pick(c, 'isActive', 'IsActive') === false ? ' (غیرفعال)' : ''}`;
        catSel.appendChild(opt);
      });
  };

  const populateDropdowns = async (options = {}) => {
    const { includeCategoryId = null } = options;
    const catSel = document.getElementById('categoryId');
    const supSel = document.getElementById('supplierId');
    if (!catSel || !supSel) return;

    catSel.innerHTML = '<option value="">انتخاب کنید...</option>';
    supSel.innerHTML = '<option value="">انتخاب کنید...</option>';

    try {
      await ShopAdmin.api.ensureApiAuth();
      const [cats, supPage] = await Promise.all([
        ShopAdmin.api.getCategories(),
        ShopAdmin.api.getSuppliers()
      ]);

      appendCategoryOptions(cats, catSel, includeCategoryId);

      (supPage?.items || supPage?.Items || []).forEach((s) => {
        const opt = document.createElement('option');
        opt.value = pick(s, 'id', 'Id');
        opt.textContent = `${pick(s, 'name', 'Name') || ''}${pick(s, 'isActive', 'IsActive') === false ? ' (غیرفعال)' : ''}`;
        supSel.appendChild(opt);
      });
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err));
    }
  };

  const markDirty = () => { isDirty = true; };

  const showImagePreview = (url) => {
    if (!url) {
      imagePreviewWrap?.classList.add('d-none');
      return;
    }
    imagePreview.src = /^blob:|^data:/.test(url) ? url : ShopAdmin.api.mediaUrl(url);
    imagePreviewWrap?.classList.remove('d-none');
  };

  const showOgImagePreview = (url) => {
    if (!ogImagePreview) return;
    if (!url) {
      ogImagePreview.innerHTML = '';
      return;
    }
    const src = /^blob:|^data:/.test(url) ? url : ShopAdmin.api.mediaUrl(url);
    ogImagePreview.innerHTML = `<img src="${escapeHtml(src)}" class="img-thumbnail" style="max-height:120px" alt="OG">`;
  };

  const uploadPendingFiles = async () => {
    if (pendingImageFile) {
      const result = await ShopAdmin.api.uploadFile(pendingImageFile, 'products');
      primaryImageId = pick(result, 'id', 'Id');
      imageRemoved = false;
      pendingImageFile = null;
    }
    if (pendingOgFile) {
      const result = await ShopAdmin.api.uploadFile(pendingOgFile, 'products');
      ogImageId = pick(result, 'id', 'Id');
      ogImageRemoved = false;
      pendingOgFile = null;
    }
  };

  const handleImageFile = (file) => {
    const err = validateImageFile(file);
    if (err) {
      ShopAdmin.ui.showToast('error', err);
      return;
    }
    pendingImageFile = file;
    imageRemoved = false;
    markDirty();
    showImagePreview(URL.createObjectURL(file));
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
      primaryImageId = null;
      pendingImageFile = null;
      imageRemoved = true;
      imagePreviewWrap?.classList.add('d-none');
      markDirty();
    });
    document.getElementById('ogImageFile')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const err = validateImageFile(file);
      if (err) {
        ShopAdmin.ui.showToast('error', err);
        e.target.value = '';
        return;
      }
      pendingOgFile = file;
      ogImageRemoved = false;
      markDirty();
      showOgImagePreview(URL.createObjectURL(file));
      e.target.value = '';
    });
  };

  const mapApiToForm = (dto) => ({
    id: pick(dto, 'id', 'Id'),
    name: pick(dto, 'name', 'Name') || '',
    categoryId: pick(dto, 'categoryId', 'CategoryId'),
    supplierId: pick(dto, 'supplierId', 'SupplierId'),
    price: pick(dto, 'price', 'Price'),
    stock: pick(dto, 'stock', 'Stock'),
    minimumStock: pick(dto, 'minimumStock', 'MinimumStock') ?? 5,
    isActive: pick(dto, 'isActive', 'IsActive') !== false,
    description: pick(dto, 'description', 'Description') || '',
    slug: pick(dto, 'slug', 'Slug') || '',
    createdAt: pick(dto, 'createdAt', 'CreatedAt') || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rating: 0,
    reviewCount: 0,
    seo: {
      metaTitle: pick(dto, 'metaTitle', 'MetaTitle') || '',
      metaDescription: pick(dto, 'metaDescription', 'MetaDescription') || '',
      keywords: pick(dto, 'metaKeywords', 'MetaKeywords') || '',
      canonicalUrl: pick(dto, 'canonicalUrl', 'CanonicalUrl') || '',
      ogTitle: pick(dto, 'ogTitle', 'OgTitle') || '',
      ogDescription: pick(dto, 'ogDescription', 'OgDescription') || '',
      index: true,
      follow: true
    }
  });

  const updateCharCount = (inputId, countId, warnId, min, max) => {
    const input = document.getElementById(inputId);
    const countEl = document.getElementById(countId);
    const warnEl = document.getElementById(warnId);
    if (!input || !countEl) return;
    const len = (input.value || '').length;
    countEl.textContent = len.toLocaleString('fa-IR');
    if (warnEl) {
      warnEl.classList.toggle('d-none', len >= min && len <= max);
    }
  };

  const updateSeoPreview = () => {
    const name = document.getElementById('name')?.value?.trim() || 'عنوان محصول';
    const slug = document.getElementById('slug')?.value?.trim() || 'product-slug';
    const metaTitle = document.getElementById('metaTitle')?.value?.trim() || name;
    const metaDesc = document.getElementById('metaDescription')?.value?.trim() || 'توضیحات SEO محصول...';
    const ogTitle = document.getElementById('ogTitle')?.value?.trim() || metaTitle;
    const ogDesc = document.getElementById('ogDescription')?.value?.trim() || metaDesc;

    document.getElementById('seo-preview-title').textContent = metaTitle;
    document.getElementById('seo-preview-url').textContent = `https://shop.example/product/${slug}`;
    document.getElementById('seo-preview-desc').textContent = metaDesc;
    document.getElementById('og-preview-title').textContent = ogTitle;
    document.getElementById('og-preview-desc').textContent = ogDesc;
  };

  const autoSlug = () => {
    if (slugManual) return;
    const name = document.getElementById('name')?.value || '';
    document.getElementById('slug').value = slugify(name);
    updateSeoPreview();
  };

  const setTabError = (tab, hasError) => {
    const btn = document.querySelector(`[data-tab="${tab}"]`);
    btn?.classList.toggle('has-error', hasError);
  };

  const validateAll = () => {
    clearFieldErrors(form);

    const errors = { main: [], seo: [] };
    const name = document.getElementById('name')?.value;
    const categoryId = document.getElementById('categoryId')?.value;
    const supplierId = document.getElementById('supplierId')?.value;
    const price = document.getElementById('price')?.value;
    const stock = document.getElementById('stock')?.value;
    const minimumStock = document.getElementById('minimumStock')?.value;
    const slug = document.getElementById('slug')?.value;

    const addMainError = (field, msg) => {
      errors.main.push(msg);
      showFieldError(form.elements[field], msg);
    };

    if (validateRequired(name, 'نام محصول')) addMainError('name', validateRequired(name, 'نام محصول'));
    if (!categoryId) addMainError('categoryId', 'دسته‌بندی الزامی است.');
    if (!supplierId) addMainError('supplierId', 'تأمین‌کننده الزامی است.');

    const priceNum = Number(price);
    if (price === '' || Number.isNaN(priceNum) || priceNum < 0) addMainError('price', 'قیمت باید عدد صفر یا بیشتر باشد.');

    const stockNum = Number(stock);
    if (stock === '' || Number.isNaN(stockNum) || stockNum < 0) addMainError('stock', 'موجودی نمی‌تواند منفی باشد.');

    const minStockNum = Number(minimumStock);
    if (minimumStock !== '' && (Number.isNaN(minStockNum) || minStockNum < 0)) {
      addMainError('minimumStock', 'حداقل موجودی نمی‌تواند منفی باشد.');
    }

    const slugErr = validateSlug(slug);
    if (slugErr) {
      errors.seo.push(slugErr);
      showFieldError(document.getElementById('slug'), slugErr);
    }

    setTabError('main', errors.main.length > 0);
    setTabError('seo', errors.seo.length > 0);

    const allErrors = [...errors.main, ...errors.seo];
    if (allErrors.length) {
      const firstInvalid = form.querySelector('.is-invalid');
      firstInvalid?.focus();
      if (errors.seo.length && !errors.main.length) {
        document.getElementById('tab-seo-btn')?.click();
      }
      return false;
    }
    return true;
  };

  const collectFormData = () => ({
    name: document.getElementById('name').value.trim(),
    slug: document.getElementById('slug').value.trim(),
    categoryId: Number(document.getElementById('categoryId').value),
    supplierId: Number(document.getElementById('supplierId').value),
    price: Number(document.getElementById('price').value),
    stock: Number(document.getElementById('stock').value),
    minimumStock: Number(document.getElementById('minimumStock').value) || 0,
    isActive: document.getElementById('isActive').checked,
    description: document.getElementById('description').value.trim(),
    seo: {
      metaTitle: document.getElementById('metaTitle').value.trim(),
      metaDescription: document.getElementById('metaDescription').value.trim(),
      keywords: document.getElementById('keywords').value.trim(),
      canonicalUrl: document.getElementById('canonicalUrl').value.trim(),
      ogTitle: document.getElementById('ogTitle').value.trim(),
      ogDescription: document.getElementById('ogDescription').value.trim(),
      index: document.getElementById('seoIndex').checked,
      follow: document.getElementById('seoFollow').checked
    }
  });

  const setSubmitting = (loading) => {
    isSubmitting = loading;
    const btn = document.getElementById('btn-submit');
    btn.disabled = loading;
    btn.querySelector('.submit-text').classList.toggle('d-none', loading);
    btn.querySelector('.spinner-border').classList.toggle('d-none', !loading);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateAll()) {
      ShopAdmin.ui.showToast('error', 'لطفاً خطاهای فرم را برطرف کنید.');
      return;
    }

    setSubmitting(true);
    try {
      const data = collectFormData();
      await ShopAdmin.api.ensureApiAuth();
      await uploadPendingFiles();
      const payload = toApiPayload(data);

      if (editId) {
        await ShopAdmin.api.updateProduct(editId, payload);
        ShopAdmin.ui.showToast('success', 'محصول با موفقیت به‌روزرسانی شد.');
      } else {
        await ShopAdmin.api.createProduct(payload);
        ShopAdmin.ui.showToast('success', 'محصول با موفقیت ثبت شد.');
      }

      isDirty = false;
      setTimeout(() => { window.location.href = 'products.html'; }, 600);
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err));
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const loadProduct = async (id) => {
    let product;
    let dto;
    try {
      await ShopAdmin.api.ensureApiAuth();
      dto = await ShopAdmin.api.getProduct(id);
      product = mapApiToForm(dto);
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err) || 'محصول یافت نشد.');
      window.location.href = 'products.html';
      return;
    }

    if (!product?.id) {
      ShopAdmin.ui.showToast('error', 'محصول یافت نشد.');
      window.location.href = 'products.html';
      return;
    }

    await populateDropdowns({ includeCategoryId: product.categoryId });

    editId = id;
    document.getElementById('form-page-title').textContent = 'ویرایش محصول';
    document.getElementById('tab-system-btn')?.classList.remove('d-none');

    document.getElementById('name').value = product.name || '';
    document.getElementById('categoryId').value = product.categoryId || '';
    document.getElementById('supplierId').value = product.supplierId || '';
    document.getElementById('price').value = product.price ?? '';
    document.getElementById('stock').value = product.stock ?? '';
    document.getElementById('minimumStock').value = product.minimumStock ?? 5;
    document.getElementById('isActive').checked = product.isActive !== false;
    document.getElementById('description').value = product.description || '';

    const existingSlug = (product.slug || '').trim();
    slugManual = Boolean(existingSlug);
    document.getElementById('slug').value = existingSlug || slugify(product.name || '');
    const seo = product.seo || defaultSeo();
    document.getElementById('metaTitle').value = seo.metaTitle || '';
    document.getElementById('metaDescription').value = seo.metaDescription || '';
    document.getElementById('keywords').value = seo.keywords || '';
    document.getElementById('canonicalUrl').value = seo.canonicalUrl || '';
    document.getElementById('ogTitle').value = seo.ogTitle || '';
    document.getElementById('ogDescription').value = seo.ogDescription || '';
    document.getElementById('seoIndex').checked = seo.index !== false;
    document.getElementById('seoFollow').checked = seo.follow !== false;

    document.getElementById('sys-id').value = product.id;
    document.getElementById('sys-createdAt').value = formatDateTime(product.createdAt);
    document.getElementById('sys-updatedAt').value = formatDateTime(product.updatedAt);
    document.getElementById('sys-rating').value = (Number(product.rating) || 0).toLocaleString('fa-IR', { minimumFractionDigits: 1 });
    document.getElementById('sys-reviewCount').value = (Number(product.reviewCount) || 0).toLocaleString('fa-IR');

    document.getElementById('btn-delete')?.classList.remove('d-none');
    document.getElementById('btn-deactivate')?.classList.add('d-none');

    primaryImageId = pick(dto, 'primaryImageId', 'PrimaryImageId') ?? null;
    ogImageId = pick(dto, 'ogImageId', 'OgImageId') ?? null;
    imageRemoved = false;
    ogImageRemoved = false;
    pendingImageFile = null;
    pendingOgFile = null;
    showImagePreview(pick(dto, 'imageUrl', 'ImageUrl') || pick(dto, 'thumbnailUrl', 'ThumbnailUrl'));
    showOgImagePreview(pick(dto, 'ogImageUrl', 'OgImageUrl'));

    updateSeoPreview();
    updateCharCount('metaTitle', 'metaTitle-count', 'metaTitle-warn', 30, 60);
    updateCharCount('metaDescription', 'metaDescription-count', 'metaDescription-warn', 120, 160);
  };

  const handleDelete = () => {
    if (!editId) return;
    ShopAdmin.ui.showConfirmModal('حذف محصول', 'آیا از حذف این محصول مطمئن هستید؟', async () => {
      try {
        await ShopAdmin.api.ensureApiAuth();
        await ShopAdmin.api.deleteProduct(editId);
        isDirty = false;
        ShopAdmin.ui.showToast('success', 'محصول حذف شد.');
        window.location.href = 'products.html';
      } catch (err) {
        ShopAdmin.ui.showToast('error', apiError(err));
      }
    });
  };

  const handleDeactivate = async () => {
    if (!editId || isSubmitting) return;
    document.getElementById('isActive').checked = false;

    setSubmitting(true);
    try {
      const data = collectFormData();
      data.isActive = false;
      await ShopAdmin.api.ensureApiAuth();
      await uploadPendingFiles();
      await ShopAdmin.api.updateProduct(editId, toApiPayload(data));
      isDirty = false;
      ShopAdmin.ui.showToast('success', 'محصول غیرفعال شد.');
      setTimeout(() => { window.location.href = 'products.html'; }, 600);
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const init = async () => {
    const params = ShopAdmin.utils.parseQuery();
    const isEdit = !!params.id;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'محصولات', href: 'products.html' },
      { label: isEdit ? 'ویرایش محصول' : 'ثبت محصول' }
    ]);

    document.getElementById('name')?.addEventListener('input', () => { autoSlug(); markDirty(); updateSeoPreview(); });
    document.getElementById('categoryId')?.addEventListener('change', markDirty);
    document.getElementById('slug')?.addEventListener('input', () => { slugManual = true; markDirty(); updateSeoPreview(); });
    ['metaTitle', 'metaDescription', 'ogTitle', 'ogDescription', 'keywords', 'canonicalUrl'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', () => {
        markDirty();
        updateSeoPreview();
        if (id === 'metaTitle') updateCharCount('metaTitle', 'metaTitle-count', 'metaTitle-warn', 30, 60);
        if (id === 'metaDescription') updateCharCount('metaDescription', 'metaDescription-count', 'metaDescription-warn', 120, 160);
      });
    });

    form.querySelectorAll('input, select, textarea').forEach((el) => {
      el.addEventListener('change', markDirty);
      el.addEventListener('input', markDirty);
    });

    form.addEventListener('submit', handleSubmit);
    document.getElementById('btn-delete')?.addEventListener('click', handleDelete);
    document.getElementById('btn-deactivate')?.addEventListener('click', handleDeactivate);
    initImageDropZone();

    window.addEventListener('beforeunload', (e) => {
      if (isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    if (isEdit) {
      await loadProduct(Number(params.id));
    } else {
      await populateDropdowns();
      updateSeoPreview();
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.ShopAdmin = window.ShopAdmin || {});
