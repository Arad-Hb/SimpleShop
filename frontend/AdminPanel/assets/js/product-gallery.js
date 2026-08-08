/**
 * product-gallery.js — مدیریت گالری محصولات (API)
 */
(function (ShopAdmin) {
  'use strict';

  if (!ShopAdmin.auth.requireAuth()) return;

  const { escapeHtml } = ShopAdmin.utils;
  const { validateImageFile } = ShopAdmin.validation;
  const { parseError } = window.SimpleShopHttp || {};
  const apiError = (err) => (parseError ? parseError(err) : (err?.message || 'خطا در ارتباط با سرور.'));

  const pick = (dto, camel, pascal) => dto?.[camel] ?? dto?.[pascal];

  const galleryGrid = document.getElementById('gallery-grid');
  const dropZone = document.getElementById('gallery-drop-zone');
  const fileInput = document.getElementById('gallery-file-input');
  const productDropdownEl = document.getElementById('product-dropdown');

  let selectedProductId = null;
  let galleryImages = [];
  let isDirty = false;
  let isSaving = false;
  const objectUrls = new Set();
  let allProducts = [];
  let filteredProducts = [];
  let categoryMap = new Map();

  const revokeUrl = (url) => {
    if (url && objectUrls.has(url)) {
      URL.revokeObjectURL(url);
      objectUrls.delete(url);
    }
  };

  const resolveMediaUrl = (path) => {
    if (!path) return null;
    if (ShopAdmin.api?.mediaUrl) return ShopAdmin.api.mediaUrl(path) || null;
    return path;
  };

  const mapGalleryItem = (item, index = 0) => ({
    id: pick(item, 'id', 'Id'),
    fileManagerId: pick(item, 'fileManagerId', 'FileManagerId'),
    alt: pick(item, 'altText', 'AltText') || '',
    isPrimary: pick(item, 'isPrimary', 'IsPrimary') === true,
    sortOrder: pick(item, 'sortOrder', 'SortOrder') ?? index,
    previewUrl: resolveMediaUrl(pick(item, 'thumbnailUrl', 'ThumbnailUrl') || pick(item, 'url', 'Url')),
    url: pick(item, 'url', 'Url'),
    thumbnailUrl: pick(item, 'thumbnailUrl', 'ThumbnailUrl')
  });

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const matchesCategory = (product, categoryFilter) => {
    if (!categoryFilter && categoryFilter !== 0) return true;
    return String(pick(product, 'categoryId', 'CategoryId')) === String(categoryFilter);
  };

  const buildProductOptions = () =>
    filteredProducts.map((p) => ({
      value: pick(p, 'id', 'Id'),
      label: `${pick(p, 'name', 'Name') || ''}${pick(p, 'isActive', 'IsActive') === false ? ' — غیرفعال' : ''}`
    }));

  const refreshProductList = () => {
    const categoryFilter = document.getElementById('gallery-category-filter')?.value ?? '';
    const search = document.getElementById('gallery-product-search')?.value?.trim().toLowerCase() || '';

    filteredProducts = allProducts.filter((p) => matchesCategory(p, categoryFilter));

    if (search) {
      filteredProducts = filteredProducts.filter((p) =>
        (pick(p, 'name', 'Name') || '').toLowerCase().includes(search)
      );
    }

    if (
      selectedProductId != null &&
      !filteredProducts.some((p) => String(pick(p, 'id', 'Id')) === String(selectedProductId))
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

  const populateCategoryFilter = async () => {
    const sel = document.getElementById('gallery-category-filter');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">همه دسته‌بندی‌ها</option>';

    try {
      await ShopAdmin.api.ensureApiAuth();
      const cats = await ShopAdmin.api.getCategories();
      categoryMap = new Map();
      (Array.isArray(cats) ? cats : []).forEach((c) => {
        const id = pick(c, 'id', 'Id');
        const name = pick(c, 'name', 'Name') || '';
        categoryMap.set(id, name);
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = name;
        sel.appendChild(opt);
      });
      if (current) sel.value = current;
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err));
    }
  };

  const loadProducts = async () => {
    try {
      await ShopAdmin.api.ensureApiAuth();
      const page = await ShopAdmin.api.getProducts({ page: 1, pageSize: 500 });
      allProducts = page?.items || page?.Items || [];
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err));
      allProducts = [];
    }
  };

  const renderGallery = () => {
    galleryImages.sort((a, b) => a.sortOrder - b.sortOrder);

    galleryGrid.innerHTML = galleryImages.map((img, index) => `
      <div class="gallery-item ${img.isPrimary ? 'primary' : ''}" data-image-id="${escapeHtml(String(img.id))}">
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
        </div>
      </div>
    `).join('');

    galleryGrid.querySelectorAll('.gallery-item').forEach((el) => {
      const id = Number(el.dataset.imageId);
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
    ShopAdmin.ui.showConfirmModal('حذف تصویر', 'آیا این تصویر از گالری حذف شود؟', async () => {
      try {
        await ShopAdmin.api.ensureApiAuth();
        await ShopAdmin.api.removeProductImage(selectedProductId, id);
        const img = galleryImages.find((i) => i.id === id);
        if (img?.previewUrl?.startsWith('blob:')) revokeUrl(img.previewUrl);
        galleryImages = galleryImages.filter((i) => i.id !== id);
        if (galleryImages.length && !galleryImages.some((i) => i.isPrimary)) {
          galleryImages[0].isPrimary = true;
          isDirty = true;
        }
        galleryImages.forEach((item, i) => { item.sortOrder = i; });
        renderGallery();
        updateProductInfoPanel();
        ShopAdmin.ui.showToast('success', 'تصویر حذف شد.');
      } catch (err) {
        ShopAdmin.ui.showToast('error', apiError(err));
      }
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

    try {
      await ShopAdmin.api.ensureApiAuth();
      const product = allProducts.find((p) => String(pick(p, 'id', 'Id')) === String(selectedProductId));
      const productName = pick(product, 'name', 'Name') || '';

      for (const file of list) {
        const err = validateImageFile(file);
        if (err) {
          ShopAdmin.ui.showToast('error', `${file.name}: ${err}`);
          continue;
        }

        const upload = await ShopAdmin.api.uploadFile(file, 'products');
        const fileManagerId = pick(upload, 'id', 'Id');
        const isPrimary = galleryImages.length === 0;
        const result = await ShopAdmin.api.addProductImage(selectedProductId, {
          fileManagerId,
          altText: productName || file.name.replace(/\.[^.]+$/, ''),
          isPrimary,
          sortOrder: galleryImages.length
        });

        const gallery = pick(result, 'gallery', 'Gallery') || [];
        const added = gallery.find((g) => pick(g, 'fileManagerId', 'FileManagerId') === fileManagerId)
          || gallery[gallery.length - 1];
        if (added) {
          galleryImages.push(mapGalleryItem(added, galleryImages.length));
        }

        processed += 1;
        showUploadProgress(Math.round((processed / list.length) * 90));
      }

      showUploadProgress(100);
      setTimeout(() => showUploadProgress(0), 400);
      renderGallery();
      updateProductInfoPanel();
      ShopAdmin.ui.showToast('success', 'تصاویر به گالری اضافه شد.');
    } catch (err) {
      showUploadProgress(0);
      ShopAdmin.ui.showToast('error', apiError(err));
    }
  };

  const updateProductInfoPanel = () => {
    const product = allProducts.find((p) => String(pick(p, 'id', 'Id')) === String(selectedProductId));
    if (!product) return;

    document.getElementById('selected-product-name').textContent = pick(product, 'name', 'Name') || '—';
    document.getElementById('selected-product-category').textContent =
      categoryMap.get(pick(product, 'categoryId', 'CategoryId')) || pick(product, 'categoryName', 'CategoryName') || '—';
    document.getElementById('selected-image-count').textContent =
      galleryImages.length.toLocaleString('fa-IR');

    const thumb = document.getElementById('selected-primary-thumb');
    const primary = galleryImages.find((i) => i.isPrimary) || galleryImages[0];
    if (primary?.previewUrl) {
      thumb.src = primary.previewUrl;
      thumb.hidden = false;
    } else {
      thumb.hidden = true;
    }
  };

  const clearWorkspace = () => {
    galleryImages.forEach((img) => { if (img.previewUrl?.startsWith('blob:')) revokeUrl(img.previewUrl); });
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
      refreshProductList();
      return;
    }
    await loadProductGallery(productId);
    refreshProductList();
  };

  const loadProductGallery = async (productId) => {
    try {
      await ShopAdmin.api.ensureApiAuth();
      const dto = await ShopAdmin.api.getProduct(productId);
      if (!dto) throw new Error('not found');

      selectedProductId = productId;
      galleryImages.forEach((img) => { if (img.previewUrl?.startsWith('blob:')) revokeUrl(img.previewUrl); });

      const gallery = pick(dto, 'gallery', 'Gallery') || [];
      galleryImages = gallery.map((item, i) => mapGalleryItem(item, i));

      if (!galleryImages.length) {
        const imageUrl = pick(dto, 'imageUrl', 'ImageUrl') || pick(dto, 'thumbnailUrl', 'ThumbnailUrl');
        if (imageUrl) {
          galleryImages = [{
            id: pick(dto, 'primaryImageId', 'PrimaryImageId') || 'primary',
            fileManagerId: pick(dto, 'primaryImageId', 'PrimaryImageId'),
            alt: pick(dto, 'name', 'Name') || '',
            isPrimary: true,
            sortOrder: 0,
            previewUrl: resolveMediaUrl(pick(dto, 'thumbnailUrl', 'ThumbnailUrl') || imageUrl),
            url: imageUrl
          }];
        }
      }

      document.getElementById('product-info-panel')?.classList.remove('d-none');
      document.getElementById('gallery-workspace')?.classList.remove('d-none');
      document.getElementById('gallery-empty')?.classList.add('d-none');

      renderGallery();
      updateProductInfoPanel();
      isDirty = false;
    } catch {
      ShopAdmin.ui.showToast('error', 'محصول یافت نشد.');
      clearWorkspace();
      refreshProductList();
    }
  };

  const saveGallery = async () => {
    if (!selectedProductId || isSaving) return;

    if (galleryImages.length && !galleryImages.some((i) => i.isPrimary)) {
      galleryImages[0].isPrimary = true;
    }

    isSaving = true;
    try {
      await ShopAdmin.api.ensureApiAuth();
      galleryImages.sort((a, b) => a.sortOrder - b.sortOrder);

      for (let i = 0; i < galleryImages.length; i += 1) {
        const img = galleryImages[i];
        if (typeof img.id !== 'number') continue;
        await ShopAdmin.api.updateProductImage(selectedProductId, img.id, {
          altText: img.alt || '',
          sortOrder: i,
          isPrimary: img.isPrimary
        });
      }

      await loadProductGallery(selectedProductId);
      ShopAdmin.ui.showToast('success', 'گالری محصول ذخیره شد.');
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err));
    } finally {
      isSaving = false;
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

    await populateCategoryFilter();
    await loadProducts();
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
      await loadProductGallery(Number(params.productId));
      refreshProductList();
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.ShopAdmin = window.ShopAdmin || {});
