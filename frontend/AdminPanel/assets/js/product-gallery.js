/**
 * product-gallery.js — مدیریت مستقل گالری محصولات
 */
(function (ShopAdmin) {
  'use strict';

  if (!ShopAdmin.auth.requireAuth()) return;

  const { escapeHtml, generateId } = ShopAdmin.utils;
  const { validateImageFile } = ShopAdmin.validation;

  const productRepo = ShopAdmin.storage.createRepository('products');
  const categoryRepo = ShopAdmin.storage.createRepository('categories');
  const { imageStore } = ShopAdmin.storage;

  const galleryGrid = document.getElementById('gallery-grid');
  const dropZone = document.getElementById('gallery-drop-zone');
  const fileInput = document.getElementById('gallery-file-input');
  const productDropdownEl = document.getElementById('product-dropdown');

  let selectedProductId = null;
  let galleryImages = [];
  let isDirty = false;
  const objectUrls = new Set();
  let allProducts = [];
  let filteredProducts = [];

  const normalizeProduct = (p) => {
    const product = { ...p };
    if (!Array.isArray(product.images)) {
      product.images = product.imageId
        ? [{ id: product.imageId, alt: product.name || '', isPrimary: true, sortOrder: 0 }]
        : [];
    }
    return product;
  };

  const getCategoryMap = () => {
    const map = new Map();
    categoryRepo.getAll().forEach((c) => map.set(c.id, c.name));
    return map;
  };

  const revokeUrl = (url) => {
    if (url && objectUrls.has(url)) {
      URL.revokeObjectURL(url);
      objectUrls.delete(url);
    }
  };

  const API_BASE = ShopAdmin.config?.API_BASE_URL || 'http://localhost:5102';

  const resolveMediaUrl = (path) => {
    if (!path) return null;
    if (ShopAdmin.api?.mediaUrl) return ShopAdmin.api.mediaUrl(path) || null;
    if (/^https?:\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) return path;
    return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const loadImagePreview = async (imageId, fallbackUrl) => {
    const remote = resolveMediaUrl(fallbackUrl);
    if (remote) return remote;
    const blob = await imageStore.getImage(imageId);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    objectUrls.add(url);
    return url;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getPrimaryImageId = (product) => {
    const images = product.images || [];
    const primary = images.find((img) => img.isPrimary);
    return primary?.id ?? images[0]?.id ?? product.imageId ?? null;
  };

  const matchesCategory = (product, categoryFilter) => {
    if (!categoryFilter && categoryFilter !== 0) return true;
    const filterId = String(categoryFilter);
    if (product.categoryId != null && String(product.categoryId) === filterId) return true;

    // Fallback: match by category name when ids drift between local/API data
    const cat = categoryRepo.getAll().find((c) => String(c.id) === filterId);
    if (cat?.name && product.categoryName) {
      return String(product.categoryName).trim() === String(cat.name).trim();
    }
    return false;
  };

  const buildProductOptions = () =>
    filteredProducts.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.sku || '—'})${p.isActive === false ? ' — غیرفعال' : ''}`
    }));

  const refreshProductList = () => {
    const categoryFilter = document.getElementById('gallery-category-filter')?.value ?? '';
    const search = document.getElementById('gallery-product-search')?.value?.trim().toLowerCase() || '';

    allProducts = productRepo.getAll().map(normalizeProduct);
    filteredProducts = allProducts.filter((p) => matchesCategory(p, categoryFilter));

    if (search) {
      filteredProducts = filteredProducts.filter((p) =>
        (p.name || '').toLowerCase().includes(search) ||
        (p.sku || '').toLowerCase().includes(search)
      );
    }

    // Drop selection if it no longer belongs to the filtered category
    if (
      selectedProductId != null &&
      !filteredProducts.some((p) => String(p.id) === String(selectedProductId))
    ) {
      selectedProductId = null;
    }

    ShopAdmin.ui.renderSearchableDropdown(
      productDropdownEl,
      buildProductOptions(),
      selectedProductId,
      (val) => selectProduct(val),
      { placeholder: filteredProducts.length ? 'انتخاب محصول' : 'محصولی در این دسته نیست' }
    );
  };

  const populateCategoryFilter = () => {
    const sel = document.getElementById('gallery-category-filter');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">همه دسته‌بندی‌ها</option>';

    categoryRepo.getAll()
      .slice()
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || String(a.name).localeCompare(String(b.name), 'fa'))
      .forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        sel.appendChild(opt);
      });

    if (current) sel.value = current;
  };

  const renderGallery = () => {
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
        if (img) { img.alt = e.target.value; isDirty = true; }
      });
    });
  };

  const setPrimary = (id) => {
    galleryImages.forEach((img) => { img.isPrimary = img.id === id; });
    isDirty = true;
    renderGallery();
    updateProductInfoPanel();
  };

  const moveImage = (id, dir) => {
    galleryImages.sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = galleryImages.findIndex((i) => i.id === id);
    const target = idx + dir;
    if (target < 0 || target >= galleryImages.length) return;
    const temp = galleryImages[idx].sortOrder;
    galleryImages[idx].sortOrder = galleryImages[target].sortOrder;
    galleryImages[target].sortOrder = temp;
    isDirty = true;
    renderGallery();
  };

  const removeImage = (id) => {
    ShopAdmin.ui.showConfirmModal('حذف تصویر', 'آیا این تصویر از گالری حذف شود؟', () => {
      const img = galleryImages.find((i) => i.id === id);
      if (img?.previewUrl) revokeUrl(img.previewUrl);
      galleryImages = galleryImages.filter((i) => i.id !== id);
      if (galleryImages.length && !galleryImages.some((i) => i.isPrimary)) {
        galleryImages[0].isPrimary = true;
      }
      galleryImages.forEach((item, i) => { item.sortOrder = i; });
      isDirty = true;
      renderGallery();
      updateProductInfoPanel();
    });
  };

  const showUploadProgress = (pct) => {
    const wrap = document.getElementById('gallery-upload-progress');
    const bar = wrap?.querySelector('.progress-bar');
    if (!wrap || !bar) return;
    wrap.classList.toggle('d-none', pct <= 0 || pct >= 100);
    bar.style.width = `${pct}%`;
  };

  const addGalleryFiles = async (files) => {
    if (!selectedProductId) {
      ShopAdmin.ui.showToast('warning', 'ابتدا یک محصول انتخاب کنید.');
      return;
    }

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
      const product = productRepo.getById(selectedProductId);

      galleryImages.push({
        id,
        alt: product?.name || file.name.replace(/\.[^.]+$/, ''),
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
    isDirty = true;
    renderGallery();
    updateProductInfoPanel();
  };

  const updateProductInfoPanel = async () => {
    const product = normalizeProduct(productRepo.getById(selectedProductId));
    if (!product) return;

    const categories = getCategoryMap();
    document.getElementById('selected-product-name').textContent = product.name;
    document.getElementById('selected-product-sku').textContent = product.sku;
    document.getElementById('selected-product-category').textContent = categories.get(product.categoryId) || '—';
    document.getElementById('selected-image-count').textContent =
      galleryImages.length.toLocaleString('fa-IR');

    const thumb = document.getElementById('selected-primary-thumb');
    const primaryId = galleryImages.find((i) => i.isPrimary)?.id || getPrimaryImageId(product);
    if (primaryId) {
      const url = galleryImages.find((i) => i.id === primaryId)?.previewUrl || await loadImagePreview(primaryId);
      if (url) {
        thumb.src = url;
        thumb.hidden = false;
      }
    } else {
      thumb.hidden = true;
    }
  };

  const clearWorkspace = () => {
    galleryImages.forEach((img) => { if (img.previewUrl) revokeUrl(img.previewUrl); });
    galleryImages = [];
    selectedProductId = null;
    isDirty = false;
    document.getElementById('product-info-panel')?.classList.add('d-none');
    document.getElementById('gallery-workspace')?.classList.add('d-none');
    document.getElementById('gallery-empty')?.classList.remove('d-none');
    if (galleryGrid) galleryGrid.innerHTML = '';
  };

  const selectProduct = async (productId) => {
    if (String(productId) === String(selectedProductId)) return;

    if (isDirty) {
      ShopAdmin.ui.showConfirmModal(
        'تغییرات ذخیره‌نشده',
        'تغییرات گالری ذخیره نشده است. آیا بدون ذخیره ادامه می‌دهید؟',
        async () => {
          isDirty = false;
          await loadProductGallery(productId);
          refreshProductList();
        }
      );
      // Keep dropdown label on the currently loaded product until confirmed
      refreshProductList();
      return;
    }
    await loadProductGallery(productId);
    refreshProductList();
  };

  const loadProductGallery = async (productId) => {
    const product = normalizeProduct(productRepo.getById(productId));
    if (!product) {
      ShopAdmin.ui.showToast('error', 'محصول یافت نشد.');
      clearWorkspace();
      refreshProductList();
      return;
    }

    selectedProductId = productId;
    galleryImages.forEach((img) => { if (img.previewUrl) revokeUrl(img.previewUrl); });
    galleryImages = await Promise.all((product.images || []).map(async (img, i) => {
      const previewUrl = await loadImagePreview(img.id, img.thumbnailUrl || img.url || img.previewUrl);
      return {
        id: img.id,
        alt: img.alt || '',
        isPrimary: img.isPrimary === true,
        sortOrder: img.sortOrder ?? i,
        previewUrl,
        url: img.url || null,
        thumbnailUrl: img.thumbnailUrl || null
      };
    }));

    // If product has API primary image but empty gallery, show it
    if (!galleryImages.length && (product.imageUrl || product.thumbnailUrl)) {
      const previewUrl = resolveMediaUrl(product.thumbnailUrl || product.imageUrl);
      galleryImages = [{
        id: product.imageId || 'remote-primary',
        alt: product.name || '',
        isPrimary: true,
        sortOrder: 0,
        previewUrl,
        url: product.imageUrl,
        thumbnailUrl: product.thumbnailUrl
      }];
    }

    document.getElementById('product-info-panel')?.classList.remove('d-none');
    document.getElementById('gallery-workspace')?.classList.remove('d-none');
    document.getElementById('gallery-empty')?.classList.add('d-none');

    renderGallery();
    await updateProductInfoPanel();
    isDirty = false;
  };

  const saveGallery = async () => {
    if (!selectedProductId) return;

    if (galleryImages.length && !galleryImages.some((i) => i.isPrimary)) {
      galleryImages[0].isPrimary = true;
    }

    try {
      const product = normalizeProduct(productRepo.getById(selectedProductId));
      const previousIds = new Set((product.images || []).map((i) => i.id));
      const keepIds = new Set(galleryImages.map((i) => i.id));

      for (const oldId of previousIds) {
        if (!keepIds.has(oldId)) {
          await imageStore.deleteImage(oldId).catch(() => {});
        }
      }

      for (const img of galleryImages) {
        if (img.isNew && img.blob) {
          await imageStore.saveImage(img.id, img.blob);
        }
      }

      galleryImages.sort((a, b) => a.sortOrder - b.sortOrder);
      const images = galleryImages.map((img, i) => ({
        id: img.id,
        alt: img.alt || '',
        isPrimary: img.isPrimary,
        sortOrder: i
      }));
      const primary = images.find((i) => i.isPrimary);

      productRepo.update(selectedProductId, {
        images,
        imageId: primary?.id ?? null,
        updatedAt: new Date().toISOString()
      });

      galleryImages.forEach((img) => { img.isNew = false; delete img.blob; });
      isDirty = false;
      refreshProductList();
      ShopAdmin.ui.showToast('success', 'گالری محصول ذخیره شد.');
      await updateProductInfoPanel();
    } catch (err) {
      ShopAdmin.ui.showToast('error', 'خطا در ذخیره گالری.');
      console.error(err);
    }
  };

  const initDropZone = () => {
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

  const init = async () => {
    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'محصولات', href: 'products.html' },
      { label: 'گالری محصولات' }
    ]);

    if (typeof ShopAdmin.sync?.syncCatalogFromApi === 'function') {
      await ShopAdmin.sync.syncCatalogFromApi();
    }

    populateCategoryFilter();
    refreshProductList();
    initDropZone();

    document.getElementById('gallery-category-filter')?.addEventListener('change', () => {
      const searchEl = document.getElementById('gallery-product-search');
      if (searchEl) searchEl.value = '';
      clearWorkspace();
      refreshProductList();
    });

    document.getElementById('gallery-product-search')?.addEventListener('input',
      ShopAdmin.utils.debounce(refreshProductList, 300)
    );

    document.getElementById('btn-save-gallery')?.addEventListener('click', saveGallery);

    const params = ShopAdmin.utils.parseQuery();
    if (params.productId) {
      loadProductGallery(Number(params.productId));
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.ShopAdmin = window.ShopAdmin || {});
