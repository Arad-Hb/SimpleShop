/**
 * product-form.js — فرم ثبت/ویرایش محصول
 */
(function (ShopAdmin) {
  'use strict';

  if (!ShopAdmin.auth.requireAuth()) return;

  const {
    escapeHtml, slugify, generateId, formatDateTime
  } = ShopAdmin.utils;
  const {
    validateRequired, validateSlug, validateUnique, validateImageFile,
    showFieldError, clearFieldErrors
  } = ShopAdmin.validation;

  const productRepo = ShopAdmin.storage.createRepository('products');
  const categoryRepo = ShopAdmin.storage.createRepository('categories');
  const supplierRepo = ShopAdmin.storage.createRepository('suppliers');
  const orderItemRepo = ShopAdmin.storage.createRepository('orderItems');
  const { imageStore } = ShopAdmin.storage;

  const form = document.getElementById('product-form');
  const galleryGrid = document.getElementById('gallery-grid');
  const dropZone = document.getElementById('gallery-drop-zone');
  const fileInput = document.getElementById('gallery-file-input');

  let editId = null;
  let slugManual = false;
  let isDirty = false;
  let isSubmitting = false;
  let ogImageBlob = null;
  let ogImageId = null;
  let ogImageRemoved = false;

  /** @type {Array<{ id: string, alt: string, isPrimary: boolean, sortOrder: number, fileName?: string, fileSize?: number, previewUrl?: string, isNew?: boolean }>} */
  let galleryImages = [];
  const objectUrls = new Set();

  const defaultSeo = () => ({
    metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '',
    ogTitle: '', ogDescription: '', ogImageId: null, index: true, follow: true
  });

  const normalizeProduct = (p) => {
    const product = { ...p };
    if (!Array.isArray(product.images)) {
      product.images = product.imageId
        ? [{ id: product.imageId, alt: product.name || '', isPrimary: true, sortOrder: 0 }]
        : [];
    }
    if (!product.seo) product.seo = defaultSeo();
    return product;
  };

  const productHasOrders = (productId) =>
    orderItemRepo.getAll().some((item) => item.productId === productId);

  const markDirty = () => { isDirty = true; };

  const populateDropdowns = () => {
    const catSel = document.getElementById('categoryId');
    const supSel = document.getElementById('supplierId');

    categoryRepo.getAll()
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name}${c.isActive === false ? ' (غیرفعال)' : ''}`;
        catSel.appendChild(opt);
      });

    supplierRepo.getAll().forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name}${s.isActive === false ? ' (غیرفعال)' : ''}`;
      supSel.appendChild(opt);
    });
  };

  const revokeUrl = (url) => {
    if (url && objectUrls.has(url)) {
      URL.revokeObjectURL(url);
      objectUrls.delete(url);
    }
  };

  const loadImagePreview = async (imageId) => {
    const blob = await imageStore.getImage(imageId);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    objectUrls.add(url);
    return url;
  };

  const renderGallery = () => {
    if (!galleryGrid) return;
    galleryImages.sort((a, b) => a.sortOrder - b.sortOrder);

    galleryGrid.innerHTML = galleryImages.map((img, index) => `
      <div class="gallery-item ${img.isPrimary ? 'primary' : ''}" data-image-id="${escapeHtml(img.id)}">
        <img src="${escapeHtml(img.previewUrl || '')}" alt="${escapeHtml(img.alt || '')}">
        ${img.isPrimary ? '<span class="badge bg-primary position-absolute top-0 start-0 m-1">اصلی</span>' : ''}
        <div class="gallery-item-actions">
          <button type="button" class="btn btn-sm btn-light btn-set-primary" title="تصویر اصلی" aria-label="تصویر اصلی"><i class="bi bi-star${img.isPrimary ? '-fill text-warning' : ''}"></i></button>
          <button type="button" class="btn btn-sm btn-light btn-move-up" title="بالا" aria-label="بالا" ${index === 0 ? 'disabled' : ''}><i class="bi bi-arrow-up"></i></button>
          <button type="button" class="btn btn-sm btn-light btn-move-down" title="پایین" aria-label="پایین" ${index === galleryImages.length - 1 ? 'disabled' : ''}><i class="bi bi-arrow-down"></i></button>
          <button type="button" class="btn btn-sm btn-light btn-remove-image" title="حذف" aria-label="حذف"><i class="bi bi-trash text-danger"></i></button>
        </div>
        <div class="p-1 bg-white">
          <input type="text" class="form-control form-control-sm gallery-alt" placeholder="Alt Text" value="${escapeHtml(img.alt || '')}" maxlength="200">
          ${img.fileName ? `<div class="small text-muted text-truncate">${escapeHtml(img.fileName)} (${formatFileSize(img.fileSize)})</div>` : ''}
        </div>
      </div>
    `).join('');

    galleryGrid.querySelectorAll('.gallery-item').forEach((el) => {
      const id = el.dataset.imageId;
      el.querySelector('.btn-set-primary')?.addEventListener('click', () => setPrimary(id));
      el.querySelector('.btn-move-up')?.addEventListener('click', () => moveImage(id, -1));
      el.querySelector('.btn-move-down')?.addEventListener('click', () => moveImage(id, 1));
      el.querySelector('.btn-remove-image')?.addEventListener('click', () => removeImage(id));
      el.querySelector('.gallery-alt')?.addEventListener('input', (e) => {
        const img = galleryImages.find((i) => i.id === id);
        if (img) { img.alt = e.target.value; markDirty(); }
      });
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const setPrimary = (id) => {
    galleryImages.forEach((img) => { img.isPrimary = img.id === id; });
    markDirty();
    renderGallery();
  };

  const moveImage = (id, dir) => {
    galleryImages.sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = galleryImages.findIndex((i) => i.id === id);
    const target = idx + dir;
    if (target < 0 || target >= galleryImages.length) return;
    const temp = galleryImages[idx].sortOrder;
    galleryImages[idx].sortOrder = galleryImages[target].sortOrder;
    galleryImages[target].sortOrder = temp;
    markDirty();
    renderGallery();
  };

  const removeImage = (id) => {
    const img = galleryImages.find((i) => i.id === id);
    if (img?.previewUrl) revokeUrl(img.previewUrl);
    galleryImages = galleryImages.filter((i) => i.id !== id);
    if (galleryImages.length && !galleryImages.some((i) => i.isPrimary)) {
      galleryImages[0].isPrimary = true;
    }
    galleryImages.forEach((item, i) => { item.sortOrder = i; });
    markDirty();
    renderGallery();
  };

  const showUploadProgress = (pct) => {
    const wrap = document.getElementById('gallery-upload-progress');
    const bar = wrap?.querySelector('.progress-bar');
    if (!wrap || !bar) return;
    wrap.classList.toggle('d-none', pct <= 0 || pct >= 100);
    bar.style.width = `${pct}%`;
  };

  const addGalleryFiles = async (files) => {
    const list = [...files];
    if (!list.length) return;

    let processed = 0;
    showUploadProgress(5);

    for (const file of list) {
      const err = validateImageFile(file);
      if (err) {
        ShopAdmin.ui.showToast('error', `${file.name}: ${err}`);
        continue;
      }

      const id = generateId('img');
      const previewUrl = URL.createObjectURL(file);
      objectUrls.add(previewUrl);

      galleryImages.push({
        id,
        alt: document.getElementById('name')?.value?.trim() || file.name.replace(/\.[^.]+$/, ''),
        isPrimary: galleryImages.length === 0,
        sortOrder: galleryImages.length,
        fileName: file.name,
        fileSize: file.size,
        previewUrl,
        isNew: true,
        blob: file
      });

      processed += 1;
      showUploadProgress(Math.round((processed / list.length) * 90));
    }

    showUploadProgress(100);
    setTimeout(() => showUploadProgress(0), 400);
    markDirty();
    renderGallery();
  };

  const initGalleryDropZone = () => {
    dropZone?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput?.click(); }
    });
    dropZone?.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      addGalleryFiles(e.dataTransfer?.files || []);
    });
    fileInput?.addEventListener('change', (e) => {
      addGalleryFiles(e.target.files || []);
      e.target.value = '';
    });
  };

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

  const renderOgPreview = async () => {
    const previewEl = document.getElementById('og-preview-image');
    if (!previewEl) return;

    let url = null;
    if (ogImageBlob) {
      url = URL.createObjectURL(ogImageBlob);
    } else if (ogImageId) {
      url = await loadImagePreview(ogImageId);
    }

    if (url) {
      previewEl.innerHTML = `<img src="${url}" class="img-fluid rounded" alt="OG">`;
    } else {
      previewEl.innerHTML = '<span class="text-muted small">بدون تصویر</span>';
    }
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
    document.getElementById('gallery-error')?.classList.add('d-none');

    const errors = { main: [], gallery: [], seo: [] };
    const products = productRepo.getAll();

    const name = document.getElementById('name')?.value;
    const sku = document.getElementById('sku')?.value;
    const categoryId = document.getElementById('categoryId')?.value;
    const supplierId = document.getElementById('supplierId')?.value;
    const price = document.getElementById('price')?.value;
    const discountPrice = document.getElementById('discountPrice')?.value;
    const stock = document.getElementById('stock')?.value;
    const minimumStock = document.getElementById('minimumStock')?.value;
    const slug = document.getElementById('slug')?.value;

    const addMainError = (field, msg) => {
      errors.main.push(msg);
      showFieldError(form.elements[field], msg);
    };

    if (validateRequired(name, 'نام محصول')) addMainError('name', validateRequired(name, 'نام محصول'));
    if (validateRequired(sku, 'کد محصول')) addMainError('sku', validateRequired(sku, 'کد محصول'));
    else if (validateUnique(sku, products, 'sku', editId)) addMainError('sku', validateUnique(sku, products, 'sku', editId));
    if (!categoryId) addMainError('categoryId', 'دسته‌بندی الزامی است.');
    if (!supplierId) addMainError('supplierId', 'تأمین‌کننده الزامی است.');

    const priceNum = Number(price);
    if (price === '' || Number.isNaN(priceNum) || priceNum < 0) addMainError('price', 'قیمت باید عدد صفر یا بیشتر باشد.');

    if (discountPrice !== '' && discountPrice != null) {
      const disc = Number(discountPrice);
      if (Number.isNaN(disc) || disc < 0) addMainError('discountPrice', 'قیمت تخفیف نامعتبر است.');
      else if (disc >= priceNum) addMainError('discountPrice', 'قیمت تخفیف باید کمتر از قیمت اصلی باشد.');
    }

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
    } else if (validateUnique(slug, products, 'slug', editId)) {
      errors.seo.push('شناسه URL تکراری است.');
      showFieldError(document.getElementById('slug'), 'شناسه URL تکراری است.');
    }

    if (!galleryImages.length) {
      errors.gallery.push('حداقل یک تصویر الزامی است.');
    } else if (!galleryImages.some((i) => i.isPrimary)) {
      errors.gallery.push('یک تصویر باید به‌عنوان تصویر اصلی انتخاب شود.');
    }

    setTabError('main', errors.main.length > 0);
    setTabError('gallery', errors.gallery.length > 0);
    setTabError('seo', errors.seo.length > 0);

    if (errors.gallery.length) {
      const galleryErr = document.getElementById('gallery-error');
      if (galleryErr) {
        galleryErr.textContent = errors.gallery.join(' ');
        galleryErr.classList.remove('d-none');
      }
    }

    const allErrors = [...errors.main, ...errors.gallery, ...errors.seo];
    if (allErrors.length) {
      const firstInvalid = form.querySelector('.is-invalid');
      firstInvalid?.focus();
      if (errors.gallery.length) {
        document.getElementById('tab-gallery-btn')?.click();
      } else if (errors.seo.length && !errors.main.length) {
        document.getElementById('tab-seo-btn')?.click();
      }
      return false;
    }
    return true;
  };

  const saveImages = async () => {
    for (const img of galleryImages) {
      if (img.isNew && img.blob) {
        await imageStore.saveImage(img.id, img.blob);
      }
    }
    if (ogImageBlob) {
      ogImageId = ogImageId || generateId('og');
      await imageStore.saveImage(ogImageId, ogImageBlob);
    } else if (ogImageRemoved) {
      if (ogImageId) await imageStore.deleteImage(ogImageId).catch(() => {});
      ogImageId = null;
    }
  };

  const collectFormData = () => {
    galleryImages.sort((a, b) => a.sortOrder - b.sortOrder);
    const images = galleryImages.map((img, i) => ({
      id: img.id,
      alt: img.alt || '',
      isPrimary: img.isPrimary,
      sortOrder: i
    }));

    return {
      name: document.getElementById('name').value.trim(),
      slug: document.getElementById('slug').value.trim(),
      sku: document.getElementById('sku').value.trim(),
      categoryId: Number(document.getElementById('categoryId').value),
      supplierId: Number(document.getElementById('supplierId').value),
      price: Number(document.getElementById('price').value),
      discountPrice: document.getElementById('discountPrice').value !== ''
        ? Number(document.getElementById('discountPrice').value) : null,
      stock: Number(document.getElementById('stock').value),
      minimumStock: Number(document.getElementById('minimumStock').value) || 0,
      isActive: document.getElementById('isActive').checked,
      description: document.getElementById('description').value.trim(),
      images,
      seo: {
        metaTitle: document.getElementById('metaTitle').value.trim(),
        metaDescription: document.getElementById('metaDescription').value.trim(),
        keywords: document.getElementById('keywords').value.trim(),
        canonicalUrl: document.getElementById('canonicalUrl').value.trim(),
        ogTitle: document.getElementById('ogTitle').value.trim(),
        ogDescription: document.getElementById('ogDescription').value.trim(),
        ogImageId: ogImageId,
        index: document.getElementById('seoIndex').checked,
        follow: document.getElementById('seoFollow').checked
      }
    };
  };

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
      await saveImages();
      const data = collectFormData();
      const primary = data.images.find((i) => i.isPrimary);

      if (editId) {
        productRepo.update(editId, { ...data, imageId: primary?.id ?? null });
        ShopAdmin.ui.showToast('success', 'محصول با موفقیت به‌روزرسانی شد.');
      } else {
        productRepo.create({ ...data, imageId: primary?.id ?? null, rating: 0, reviewCount: 0 });
        ShopAdmin.ui.showToast('success', 'محصول با موفقیت ثبت شد.');
      }

      isDirty = false;
      setTimeout(() => { window.location.href = 'products.html'; }, 600);
    } catch (err) {
      ShopAdmin.ui.showToast('error', 'خطا در ذخیره محصول.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const loadProduct = async (id) => {
    const product = normalizeProduct(productRepo.getById(id));
    if (!product) {
      ShopAdmin.ui.showToast('error', 'محصول یافت نشد.');
      window.location.href = 'products.html';
      return;
    }

    editId = id;
    document.getElementById('form-page-title').textContent = 'ویرایش محصول';
    document.getElementById('tab-system-btn')?.classList.remove('d-none');

    document.getElementById('name').value = product.name || '';
    document.getElementById('sku').value = product.sku || '';
    document.getElementById('categoryId').value = product.categoryId || '';
    document.getElementById('supplierId').value = product.supplierId || '';
    document.getElementById('price').value = product.price ?? '';
    document.getElementById('discountPrice').value = product.discountPrice ?? '';
    document.getElementById('stock').value = product.stock ?? '';
    document.getElementById('minimumStock').value = product.minimumStock ?? 5;
    document.getElementById('isActive').checked = product.isActive !== false;
    document.getElementById('description').value = product.description || '';

    slugManual = true;
    document.getElementById('slug').value = product.slug || '';
    const seo = product.seo || defaultSeo();
    document.getElementById('metaTitle').value = seo.metaTitle || '';
    document.getElementById('metaDescription').value = seo.metaDescription || '';
    document.getElementById('keywords').value = seo.keywords || '';
    document.getElementById('canonicalUrl').value = seo.canonicalUrl || '';
    document.getElementById('ogTitle').value = seo.ogTitle || '';
    document.getElementById('ogDescription').value = seo.ogDescription || '';
    document.getElementById('seoIndex').checked = seo.index !== false;
    document.getElementById('seoFollow').checked = seo.follow !== false;
    ogImageId = seo.ogImageId || null;

    document.getElementById('sys-id').value = product.id;
    document.getElementById('sys-createdAt').value = formatDateTime(product.createdAt);
    document.getElementById('sys-updatedAt').value = formatDateTime(product.updatedAt);
    document.getElementById('sys-rating').value = (Number(product.rating) || 0).toLocaleString('fa-IR', { minimumFractionDigits: 1 });
    document.getElementById('sys-reviewCount').value = (Number(product.reviewCount) || 0).toLocaleString('fa-IR');

    galleryImages = await Promise.all((product.images || []).map(async (img, i) => {
      const previewUrl = await loadImagePreview(img.id);
      return {
        id: img.id,
        alt: img.alt || '',
        isPrimary: img.isPrimary === true,
        sortOrder: img.sortOrder ?? i,
        previewUrl
      };
    }));

    if (ogImageId) {
      const ogUrl = await loadImagePreview(ogImageId);
      if (ogUrl) {
        document.getElementById('og-image-preview').innerHTML =
          `<img src="${ogUrl}" class="img-thumbnail" style="max-height:80px" alt="OG">`;
      }
    }

    const hasOrders = productHasOrders(id);
    const btnDelete = document.getElementById('btn-delete');
    const btnDeactivate = document.getElementById('btn-deactivate');
    if (hasOrders) {
      btnDelete?.classList.add('d-none');
      btnDeactivate?.classList.remove('d-none');
    } else {
      btnDelete?.classList.remove('d-none');
      btnDeactivate?.classList.add('d-none');
    }

    renderGallery();
    updateSeoPreview();
    updateCharCount('metaTitle', 'metaTitle-count', 'metaTitle-warn', 30, 60);
    updateCharCount('metaDescription', 'metaDescription-count', 'metaDescription-warn', 120, 160);
    await renderOgPreview();
  };

  const handleDelete = () => {
    if (!editId) return;
    ShopAdmin.ui.showConfirmModal('حذف محصول', 'آیا از حذف این محصول مطمئن هستید؟', async () => {
      const product = productRepo.getById(editId);
      const ids = [...(product?.images || []).map((i) => i.id), product?.seo?.ogImageId].filter(Boolean);
      await Promise.all(ids.map((imgId) => imageStore.deleteImage(imgId).catch(() => {})));
      productRepo.remove(editId);
      isDirty = false;
      ShopAdmin.ui.showToast('success', 'محصول حذف شد.');
      window.location.href = 'products.html';
    });
  };

  const handleDeactivate = () => {
    if (!editId) return;
    productRepo.update(editId, { isActive: false });
    document.getElementById('isActive').checked = false;
    isDirty = false;
    ShopAdmin.ui.showToast('warning', 'محصول غیرفعال شد.');
  };

  const init = () => {
    const params = ShopAdmin.utils.parseQuery();
    const isEdit = !!params.id;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'محصولات', href: 'products.html' },
      { label: isEdit ? 'ویرایش محصول' : 'ثبت محصول' }
    ]);

    populateDropdowns();
    initGalleryDropZone();

    document.getElementById('name')?.addEventListener('input', () => { autoSlug(); markDirty(); updateSeoPreview(); });
    document.getElementById('slug')?.addEventListener('input', () => { slugManual = true; markDirty(); updateSeoPreview(); });
    ['metaTitle', 'metaDescription', 'ogTitle', 'ogDescription', 'keywords', 'canonicalUrl'].forEach((id) => {
      document.getElementById(id)?.addEventListener('input', () => {
        markDirty();
        updateSeoPreview();
        if (id === 'metaTitle') updateCharCount('metaTitle', 'metaTitle-count', 'metaTitle-warn', 30, 60);
        if (id === 'metaDescription') updateCharCount('metaDescription', 'metaDescription-count', 'metaDescription-warn', 120, 160);
      });
    });

    document.getElementById('ogImageFile')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const err = validateImageFile(file);
      if (err) { ShopAdmin.ui.showToast('error', err); return; }
      ogImageBlob = file;
      ogImageRemoved = false;
      const url = URL.createObjectURL(file);
      document.getElementById('og-image-preview').innerHTML =
        `<img src="${url}" class="img-thumbnail" style="max-height:80px" alt="OG">`;
      markDirty();
      await renderOgPreview();
    });

    form.querySelectorAll('input, select, textarea').forEach((el) => {
      el.addEventListener('change', markDirty);
      el.addEventListener('input', markDirty);
    });

    form.addEventListener('submit', handleSubmit);
    document.getElementById('btn-delete')?.addEventListener('click', handleDelete);
    document.getElementById('btn-deactivate')?.addEventListener('click', handleDeactivate);

    window.addEventListener('beforeunload', (e) => {
      if (isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    if (isEdit) {
      loadProduct(Number(params.id));
    } else {
      updateSeoPreview();
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.ShopAdmin = window.ShopAdmin || {});
