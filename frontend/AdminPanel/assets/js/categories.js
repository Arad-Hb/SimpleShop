/**
 * categories.js — مدیریت دسته‌بندی‌ها (لیست + فرم) — متصل به API
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml, slugify, debounce, parseQuery } = ShopAdmin.utils;
  const { sortItems } = ShopAdmin.pagination;
  const { validateRequired, validateSlug, validateForm } = ShopAdmin.validation;
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
    productCount: pick(dto, 'productCount', 'ProductCount') ?? 0
  });

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
    imageFileId: pick(dto, 'imageFileId', 'ImageFileId') ?? null
  });

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

  const attrEsc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');

  const validateSortOrder = (value) => {
    const num = Number(value);
    if (Number.isNaN(num) || num < 0) return 'ترتیب نمایش باید عددی بزرگ‌تر یا مساوی صفر باشد.';
    return null;
  };

  const indentName = (name, depth) => {
    if (!depth) return escapeHtml(name);
    return `${'— '.repeat(depth)}${escapeHtml(name)}`;
  };

  // ─── List Page ───────────────────────────────────────────────

  const initCategoriesList = () => {
    const state = {
      search: '',
      statusFilter: 'all',
      sortField: 'sortOrder',
      sortDir: 'asc',
      page: 1,
      pageSize: 10,
      totalItems: 0,
      loading: false
    };

    const tbody = document.getElementById('categories-tbody');
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const pageSizeSelect = document.getElementById('page-size-select');
    const paginationInfo = document.getElementById('pagination-info');
    const paginationContainer = document.getElementById('pagination-container');
    const table = document.getElementById('categories-table');

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'دسته‌بندی‌ها' }
    ]);

    const applyStatusFilter = (items) => {
      if (state.statusFilter === 'active') return items.filter((item) => item.isActive);
      if (state.statusFilter === 'inactive') return items.filter((item) => !item.isActive);
      return items;
    };

    const renderStatusBadge = (isActive) =>
      isActive
        ? '<span class="badge bg-success">فعال</span>'
        : '<span class="badge bg-secondary">غیرفعال</span>';

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

    const renderTable = async () => {
      if (state.loading) return;
      state.loading = true;
      tbody.innerHTML = `
        <tr><td colspan="9" class="text-center text-muted py-5">
          <span class="spinner-border spinner-border-sm me-2"></span>در حال بارگذاری...
        </td></tr>`;

      try {
        await ShopAdmin.api.ensureApiAuth();
        const data = await ShopAdmin.api.searchCategories({
          pageIndex: state.page - 1,
          pageSize: state.pageSize,
          search: state.search.trim()
        });

        const searchModel = data?.searchModel || data?.SearchModel || {};
        state.totalItems = Number(searchModel.recordCount ?? searchModel.RecordCount ?? 0);

        let items = (data?.items || data?.Items || []).map(mapListItem);
        items = applyStatusFilter(items);
        items = sortItems(items, state.sortField, state.sortDir);

        if (!items.length) {
          tbody.innerHTML = `
            <tr>
              <td colspan="9" class="text-center text-muted py-5">
                <i class="bi bi-tags display-6 d-block mb-2 opacity-50"></i>
                دسته‌بندی‌ای یافت نشد.
              </td>
            </tr>`;
        } else {
          tbody.innerHTML = items.map((item) => `
            <tr data-id="${item.id}" data-name="${attrEsc(item.name)}" data-product-count="${item.productCount}" data-child-count="${item.childCount}">
              <td>${item.id.toLocaleString('fa-IR')}</td>
              <td><strong>${indentName(item.name, item.depth)}</strong></td>
              <td class="text-muted">${escapeHtml(item.description || '—')}</td>
              <td>${item.sortOrder.toLocaleString('fa-IR')}</td>
              <td>${renderStatusBadge(item.isActive)}</td>
              <td><span class="badge bg-light text-dark border">${item.productCount.toLocaleString('fa-IR')}</span></td>
              <td class="text-muted">${escapeHtml(item.parentName || '—')}</td>
              <td>${item.depth.toLocaleString('fa-IR')}</td>
              <td class="text-center">${renderActions(item)}</td>
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
          <tr><td colspan="9" class="text-center text-danger py-5">${escapeHtml(apiError(err))}</td></tr>`;
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

        const bodyHtml = `
          <dl class="row mb-0">
            <dt class="col-sm-4">شناسه</dt><dd class="col-sm-8">${item.id.toLocaleString('fa-IR')}</dd>
            <dt class="col-sm-4">نام</dt><dd class="col-sm-8">${escapeHtml(item.name)}</dd>
            <dt class="col-sm-4">شناسه URL</dt><dd class="col-sm-8"><code dir="ltr">${escapeHtml(item.slug || '—')}</code></dd>
            <dt class="col-sm-4">توضیحات</dt><dd class="col-sm-8">${escapeHtml(item.description || '—')}</dd>
            <dt class="col-sm-4">والد</dt><dd class="col-sm-8">${escapeHtml(item.parentId ? String(item.parentId) : '—')}</dd>
            <dt class="col-sm-4">ترتیب</dt><dd class="col-sm-8">${item.sortOrder.toLocaleString('fa-IR')}</dd>
            <dt class="col-sm-4">سطح</dt><dd class="col-sm-8">${item.depth.toLocaleString('fa-IR')}</dd>
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
          imageFileId: item.imageFileId
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

    tbody?.addEventListener('click', (e) => {
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

    renderTable();
  };

  // ─── Form Page ───────────────────────────────────────────────

  const initCategoryForm = () => {
    const query = parseQuery();
    const editId = query.id ? Number(query.id) : null;
    const isEdit = editId != null && !Number.isNaN(editId);

    const form = document.getElementById('category-form');
    const nameInput = document.getElementById('category-name');
    const slugInput = document.getElementById('category-slug');
    const descInput = document.getElementById('category-description');
    const parentSelect = document.getElementById('category-parent');
    const sortInput = document.getElementById('category-sort-order');
    const activeInput = document.getElementById('category-is-active');
    const idInput = document.getElementById('category-id');
    const btnDelete = document.getElementById('btn-delete');
    const btnSave = document.getElementById('btn-save');
    const metaDates = document.getElementById('meta-dates');
    const formHeading = document.getElementById('form-heading');
    const formPageTitle = document.getElementById('form-page-title');

    let slugManual = false;
    let categoryTree = [];
    let loadedItem = null;
    let isSubmitting = false;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'دسته‌بندی‌ها', href: 'categories.html' },
      { label: isEdit ? 'ویرایش' : 'افزودن' }
    ]);

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
        metaTitle: loadedItem?.metaTitle || null,
        metaDescription: loadedItem?.metaDescription || null,
        imageFileId: loadedItem?.imageFileId ?? null
      };
    };

    const submitPayload = async (payload) => {
      if (isSubmitting) return;
      isSubmitting = true;
      if (btnSave) btnSave.disabled = true;

      try {
        await ShopAdmin.api.ensureApiAuth();
        if (isEdit) await ShopAdmin.api.updateCategory(editId, payload);
        else await ShopAdmin.api.createCategory(payload);

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
        isSubmitting = false;
        if (btnSave) btnSave.disabled = false;
      }
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

          const exclude = collectDescendantIds(categoryTree, editId);
          populateParentOptions(exclude);

          idInput.value = loadedItem.id;
          nameInput.value = loadedItem.name;
          slugInput.value = loadedItem.slug || '';
          descInput.value = loadedItem.description || '';
          sortInput.value = loadedItem.sortOrder ?? 0;
          activeInput.checked = loadedItem.isActive;
          if (loadedItem.parentId) parentSelect.value = String(loadedItem.parentId);

          metaDates?.classList.add('d-none');
          btnDelete?.classList.remove('d-none');

          formHeading.textContent = 'ویرایش دسته‌بندی';
          formPageTitle.textContent = 'ویرایش دسته‌بندی';
          document.title = 'ویرایش دسته‌بندی — پنل مدیریت فروشگاه';

          if (loadedItem.slug) slugManual = true;
        } else {
          populateParentOptions();
        }
      } catch (err) {
        ShopAdmin.ui.showToast('error', apiError(err));
      }
    };

    slugInput?.addEventListener('input', () => {
      slugManual = slugInput.value.trim().length > 0;
    });

    nameInput?.addEventListener('input', () => {
      if (!slugManual && slugInput) {
        slugInput.value = slugify(nameInput.value);
      }
    });

    btnDelete?.addEventListener('click', () => {
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
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();

      const { valid } = validateForm(form, [
        {
          name: 'name',
          label: 'نام',
          rules: [(v) => validateRequired(v, 'نام')]
        },
        {
          name: 'slug',
          label: 'شناسه URL',
          rules: [(v) => validateSlug(v || slugify(nameInput.value))]
        },
        {
          name: 'sortOrder',
          label: 'ترتیب نمایش',
          rules: [(v) => validateSortOrder(v)]
        }
      ]);

      if (!valid) return;
      submitPayload(buildPayload(false));
    });

    loadForm();
  };

  // ─── Init ────────────────────────────────────────────────────

  const init = () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    if (document.getElementById('category-form')) {
      initCategoryForm();
    } else if (document.getElementById('categories-table') || document.getElementById('categories-tbody')) {
      initCategoriesList();
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.ShopAdmin = window.ShopAdmin || {});
