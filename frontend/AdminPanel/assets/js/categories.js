/**
 * categories.js — صفحه فهرست دسته‌بندی‌ها
 */
(function (ShopAdmin) {
  'use strict';

  if (!ShopAdmin.auth.requireAuth()) return;

  const { escapeHtml, debounce } = ShopAdmin.utils;
  const { sortItems } = ShopAdmin.pagination;
  const { parseError } = window.SimpleShopHttp || {};

  const apiError = (err) => (parseError ? parseError(err) : (err?.message || 'خطا در ارتباط با سرور.'));

  const pick = (dto, camel, pascal) => dto?.[camel] ?? dto?.[pascal];

  const mapListItem = (dto) => ({
    id: pick(dto, 'id', 'Id'),
    name: pick(dto, 'name', 'Name') || '',
    description: pick(dto, 'description', 'Description') || '',
    slug: pick(dto, 'slug', 'Slug') || '',
    parentId: pick(dto, 'parentId', 'ParentId') ?? null,
    parentName: pick(dto, 'parentName', 'ParentName') || '',
    sortOrder: pick(dto, 'sortOrder', 'SortOrder') ?? 0,
    depth: pick(dto, 'depth', 'Depth') ?? 0,
    childCount: pick(dto, 'childCount', 'ChildCount') ?? 0,
    isActive: pick(dto, 'isActive', 'IsActive') !== false,
    productCount: pick(dto, 'productCount', 'ProductCount') ?? 0,
    thumbnailUrl: pick(dto, 'thumbnailUrl', 'ThumbnailUrl') || pick(dto, 'imageUrl', 'ImageUrl') || '',
    metaTitle: pick(dto, 'metaTitle', 'MetaTitle') || '',
    metaDescription: pick(dto, 'metaDescription', 'MetaDescription') || ''
  });

  const mapEditModel = (dto) => ({
    id: pick(dto, 'id', 'Id'),
    name: pick(dto, 'name', 'Name') || '',
    description: pick(dto, 'description', 'Description') || '',
    slug: pick(dto, 'slug', 'Slug') || '',
    parentId: pick(dto, 'parentId', 'ParentId') ?? null,
    parentName: pick(dto, 'parentName', 'ParentName') || '',
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
    imageUrl: pick(dto, 'imageUrl', 'ImageUrl') || pick(dto, 'thumbnailUrl', 'ThumbnailUrl') || ''
  });

  const flattenTree = (nodes, depth = 0, out = []) => {
    (nodes || []).forEach((node) => {
      out.push({
        id: pick(node, 'id', 'Id'),
        name: pick(node, 'name', 'Name') || '',
        depth: pick(node, 'depth', 'Depth') ?? depth,
        children: pick(node, 'children', 'Children') || []
      });
      flattenTree(pick(node, 'children', 'Children'), depth + 1, out);
    });
    return out;
  };

  const attrEsc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');

  const indentName = (name, depth) => {
    if (!depth) return escapeHtml(name);
    return `${'— '.repeat(depth)}${escapeHtml(name)}`;
  };

  const tbody = document.getElementById('categories-tbody');
  if (!tbody) return;

  const state = {
    search: '',
    statusFilter: 'all',
    parentFilter: '',
    sortField: 'sortOrder',
    sortDir: 'asc',
    page: 1,
    pageSize: 10,
    totalItems: 0,
    loading: false
  };

  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  const parentFilterEl = document.getElementById('parent-filter');
  const pageSizeSelect = document.getElementById('page-size-select');
  const paginationInfo = document.getElementById('pagination-info');
  const paginationContainer = document.getElementById('pagination-container');
  const table = document.getElementById('categories-table');

  ShopAdmin.ui.initBreadcrumb([
    { label: 'داشبورد', href: 'index.html' },
    { label: 'دسته‌بندی‌ها' }
  ]);

  const renderStatusBadge = (isActive) =>
    isActive
      ? '<span class="badge bg-success">فعال</span>'
      : '<span class="badge bg-secondary">غیرفعال</span>';

  const renderThumbnail = (url, name) => {
    if (!url) {
      return '<span class="text-muted small">—</span>';
    }
    const src = ShopAdmin.api.mediaUrl(url);
    return `<img src="${src}" alt="${attrEsc(name)}" class="rounded table-img" loading="lazy">`;
  };

  const renderActions = (item) => `
    <div class="table-actions">
      <button type="button" class="btn btn-outline-info" data-action="view" data-id="${item.id}" title="مشاهده">
        <i class="bi bi-eye"></i>
      </button>
      <a href="category-form.html?id=${item.id}" class="btn btn-outline-primary" title="ویرایش">
        <i class="bi bi-pencil"></i>
      </a>
      <button type="button" class="btn btn-outline-warning" data-action="toggle" data-id="${item.id}" title="تغییر وضعیت">
        <i class="bi bi-toggle-${item.isActive ? 'on' : 'off'}"></i>
      </button>
      <button type="button" class="btn btn-outline-danger" data-action="delete" data-id="${item.id}" title="حذف">
        <i class="bi bi-trash"></i>
      </button>
    </div>`;

  const buildSearchParams = () => {
    const params = {
      pageIndex: state.page - 1,
      pageSize: state.pageSize,
      search: state.search.trim()
    };
    if (state.statusFilter === 'active') params.isActive = true;
    else if (state.statusFilter === 'inactive') params.isActive = false;
    if (state.parentFilter) params.parentId = Number(state.parentFilter);
    return params;
  };

  const renderTable = async () => {
    if (state.loading) return;
    state.loading = true;
    tbody.innerHTML = `
      <tr><td colspan="11" class="text-center text-muted py-5">
        <span class="spinner-border spinner-border-sm me-2"></span>در حال بارگذاری...
      </td></tr>`;

    try {
      await ShopAdmin.api.ensureApiAuth();
      const data = await ShopAdmin.api.searchCategories(buildSearchParams());

      const searchModel = data?.searchModel || data?.SearchModel || {};
      state.totalItems = Number(searchModel.recordCount ?? searchModel.RecordCount ?? 0);

      let items = (data?.items || data?.Items || []).map(mapListItem);
      items = sortItems(items, state.sortField, state.sortDir);

      if (!items.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="11" class="text-center text-muted py-5">
              <i class="bi bi-tags display-6 d-block mb-2 opacity-50"></i>
              دسته‌بندی‌ای یافت نشد.
            </td>
          </tr>`;
      } else {
        tbody.innerHTML = items.map((item) => `
          <tr data-id="${item.id}" data-name="${attrEsc(item.name)}" data-product-count="${item.productCount}" data-child-count="${item.childCount}">
            <td class="col-id">${item.id.toLocaleString('fa-IR')}</td>
            <td class="col-img text-center">${renderThumbnail(item.thumbnailUrl, item.name)}</td>
            <td class="col-name"><strong class="category-name-cell">${indentName(item.name, item.depth)}</strong></td>
            <td class="col-slug"><code dir="ltr" class="small">${escapeHtml(item.slug || '—')}</code></td>
            <td class="col-desc text-muted">${escapeHtml(item.description || '—')}</td>
            <td class="col-sort">${item.sortOrder.toLocaleString('fa-IR')}</td>
            <td class="col-status">${renderStatusBadge(item.isActive)}</td>
            <td class="col-products">
              <a href="products.html?categoryId=${item.id}" class="badge bg-light text-dark border text-decoration-none">
                ${item.productCount.toLocaleString('fa-IR')}
              </a>
            </td>
            <td class="col-parent text-muted">${escapeHtml(item.parentName || '—')}</td>
            <td class="col-depth">${item.depth.toLocaleString('fa-IR')}</td>
            <td class="col-actions text-center">${renderActions(item)}</td>
          </tr>
        `).join('');
      }

      const totalPages = Math.max(1, Math.ceil(state.totalItems / state.pageSize));
      if (paginationInfo) {
        const from = state.totalItems ? (state.page - 1) * state.pageSize + 1 : 0;
        const to = Math.min(state.page * state.pageSize, state.totalItems);
        paginationInfo.textContent = `نمایش ${from.toLocaleString('fa-IR')} تا ${to.toLocaleString('fa-IR')} از ${state.totalItems.toLocaleString('fa-IR')} مورد`;
      }

      ShopAdmin.ui.renderPagination(paginationContainer, state.page, totalPages, (page) => {
        state.page = page;
        renderTable();
      });
    } catch (err) {
      tbody.innerHTML = `
        <tr><td colspan="11" class="text-center text-danger py-5">${escapeHtml(apiError(err))}</td></tr>`;
      ShopAdmin.ui.showToast('error', apiError(err));
    } finally {
      state.loading = false;
    }
  };

  const showViewModal = async (id) => {
    try {
      await ShopAdmin.api.ensureApiAuth();
      const dto = await ShopAdmin.api.getCategory(id);
      const item = mapEditModel(dto);

      const imageHtml = item.imageUrl
        ? `<img src="${ShopAdmin.api.mediaUrl(item.imageUrl)}" class="img-thumbnail mb-2" style="max-height:80px" alt="">`
        : '';

      const bodyHtml = `
        ${imageHtml}
        <dl class="row mb-0">
          <dt class="col-sm-4">شناسه</dt><dd class="col-sm-8">${item.id.toLocaleString('fa-IR')}</dd>
          <dt class="col-sm-4">نام</dt><dd class="col-sm-8">${escapeHtml(item.name)}</dd>
          <dt class="col-sm-4">شناسه URL</dt><dd class="col-sm-8"><code dir="ltr">${escapeHtml(item.slug || '—')}</code></dd>
          <dt class="col-sm-4">توضیحات</dt><dd class="col-sm-8">${escapeHtml(item.description || '—')}</dd>
          <dt class="col-sm-4">والد</dt><dd class="col-sm-8">${escapeHtml(item.parentName || '—')}</dd>
          <dt class="col-sm-4">ترتیب</dt><dd class="col-sm-8">${item.sortOrder.toLocaleString('fa-IR')}</dd>
          <dt class="col-sm-4">سطح</dt><dd class="col-sm-8">${item.depth.toLocaleString('fa-IR')}</dd>
          <dt class="col-sm-4">عنوان SEO</dt><dd class="col-sm-8">${escapeHtml(item.metaTitle || '—')}</dd>
          <dt class="col-sm-4">توضیحات SEO</dt><dd class="col-sm-8">${escapeHtml(item.metaDescription || '—')}</dd>
          <dt class="col-sm-4">وضعیت</dt><dd class="col-sm-8">${renderStatusBadge(item.isActive)}</dd>
        </dl>`;

      const modal = ShopAdmin.ui.createModal({
        id: 'categoryViewModal',
        title: 'جزئیات دسته‌بندی',
        bodyHtml,
        footerHtml: `
          <a href="category-form.html?id=${item.id}" class="btn btn-primary">ویرایش</a>
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">بستن</button>`
      });
      ShopAdmin.ui.showModal(modal);
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err));
    }
  };

  const handleToggle = async (id) => {
    try {
      await ShopAdmin.api.ensureApiAuth();
      const dto = await ShopAdmin.api.getCategory(id);
      const item = mapEditModel(dto);
      const payload = {
        name: item.name,
        description: item.description || null,
        slug: item.slug || null,
        parentId: item.parentId,
        sortOrder: item.sortOrder,
        isActive: !item.isActive,
        metaTitle: item.metaTitle || null,
        metaDescription: item.metaDescription || null,
        metaKeywords: item.metaKeywords || null,
        canonicalUrl: item.canonicalUrl || null,
        ogTitle: item.ogTitle || null,
        ogDescription: item.ogDescription || null,
        imageFileId: item.imageFileId,
        ogImageId: item.ogImageId
      };
      await ShopAdmin.api.updateCategory(id, payload);
      ShopAdmin.ui.showToast('success', payload.isActive ? 'دسته‌بندی فعال شد.' : 'دسته‌بندی غیرفعال شد.');
      renderTable();
    } catch (err) {
      ShopAdmin.ui.showToast('error', apiError(err));
    }
  };

  const handleDelete = (id, name, productCount, childCount) => {
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
      `آیا از حذف «${name}» اطمینان دارید؟`,
      async () => {
        try {
          await ShopAdmin.api.ensureApiAuth();
          await ShopAdmin.api.deleteCategory(id);
          ShopAdmin.ui.showToast('success', 'دسته‌بندی حذف شد.');
          renderTable();
        } catch (err) {
          ShopAdmin.ui.showToast('error', apiError(err));
        }
      }
    );
  };

  const populateParentFilter = async () => {
    if (!parentFilterEl) return;
    try {
      await ShopAdmin.api.ensureApiAuth();
      const tree = await ShopAdmin.api.getCategoriesTree();
      flattenTree(tree)
        .sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name, 'fa'))
        .forEach((n) => {
          const opt = document.createElement('option');
          opt.value = n.id;
          opt.textContent = `${'— '.repeat(n.depth)}${n.name}`;
          parentFilterEl.appendChild(opt);
        });
    } catch {
      /* filter optional */
    }
  };

  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;

    if (action === 'view') showViewModal(id);
    else if (action === 'toggle') handleToggle(id);
    else if (action === 'delete') {
      const row = btn.closest('tr');
      const name = row?.dataset.name || '';
      const productCount = Number(row?.dataset.productCount) || 0;
      const childCount = Number(row?.dataset.childCount) || 0;
      handleDelete(id, name, productCount, childCount);
    }
  });

  searchInput?.addEventListener('input', debounce((e) => {
    state.search = e.target.value;
    state.page = 1;
    renderTable();
  }, 350));

  statusFilter?.addEventListener('change', (e) => {
    state.statusFilter = e.target.value;
    state.page = 1;
    renderTable();
  });

  parentFilterEl?.addEventListener('change', (e) => {
    state.parentFilter = e.target.value;
    state.page = 1;
    renderTable();
  });

  pageSizeSelect?.addEventListener('change', (e) => {
    state.pageSize = Number(e.target.value) || 10;
    state.page = 1;
    renderTable();
  });

  ShopAdmin.ui.bindTableSort(table, (field, dir) => {
    state.sortField = field;
    state.sortDir = dir;
    renderTable();
  });

  populateParentFilter();
  renderTable();
})(window.ShopAdmin = window.ShopAdmin || {});
