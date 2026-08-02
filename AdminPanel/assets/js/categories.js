/**
 * categories.js — مدیریت دسته‌بندی‌ها (لیست + فرم)
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml, formatDate, formatDateTime, slugify, debounce, parseQuery } = ShopAdmin.utils;
  const { paginate, sortItems } = ShopAdmin.pagination;
  const { validateRequired, validateUnique, validateSlug, validateForm } = ShopAdmin.validation;

  const categoriesRepo = () => ShopAdmin.storage.createRepository('categories');
  const productsRepo = () => ShopAdmin.storage.createRepository('products');

  const getProductCount = (categoryId) =>
    productsRepo().getAll().filter((p) => p.categoryId === categoryId).length;

  const enrichCategories = (items) =>
    items.map((item) => ({ ...item, productCount: getProductCount(item.id) }));

  const validateSortOrder = (value) => {
    const num = Number(value);
    if (Number.isNaN(num) || num < 0) return 'ترتیب نمایش باید عددی بزرگ‌تر یا مساوی صفر باشد.';
    return null;
  };

  // ─── List Page ───────────────────────────────────────────────

  const initCategoriesList = () => {
    const state = {
      search: '',
      statusFilter: 'all',
      sortField: 'sortOrder',
      sortDir: 'asc',
      page: 1,
      pageSize: 10
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

    const filterItems = (items) => {
      let filtered = enrichCategories(items);

      if (state.search) {
        const q = state.search.trim().toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            (item.description || '').toLowerCase().includes(q) ||
            String(item.id).includes(q)
        );
      }

      if (state.statusFilter === 'active') {
        filtered = filtered.filter((item) => item.isActive !== false);
      } else if (state.statusFilter === 'inactive') {
        filtered = filtered.filter((item) => item.isActive === false);
      }

      return filtered;
    };

    const renderStatusBadge = (isActive) =>
      isActive !== false
        ? '<span class="badge bg-success">فعال</span>'
        : '<span class="badge bg-secondary">غیرفعال</span>';

    const renderActions = (item) => `
      <div class="btn-group btn-group-sm">
        <button type="button" class="btn btn-outline-info" data-action="view" data-id="${item.id}" title="مشاهده">
          <i class="bi bi-eye"></i>
        </button>
        <a href="category-form.html?id=${item.id}" class="btn btn-outline-primary" title="ویرایش">
          <i class="bi bi-pencil"></i>
        </a>
        <button type="button" class="btn btn-outline-warning" data-action="toggle" data-id="${item.id}" title="تغییر وضعیت">
          <i class="bi bi-toggle-${item.isActive !== false ? 'on' : 'off'}"></i>
        </button>
        <button type="button" class="btn btn-outline-danger" data-action="delete" data-id="${item.id}" title="حذف">
          <i class="bi bi-trash"></i>
        </button>
      </div>`;

    const renderTable = () => {
      const all = categoriesRepo().getAll();
      const filtered = filterItems(all);
      const sorted = sortItems(filtered, state.sortField, state.sortDir);
      const result = paginate(sorted, state.page, state.pageSize);

      if (!result.items.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center text-muted py-5">
              <i class="bi bi-tags display-6 d-block mb-2 opacity-50"></i>
              دسته‌بندی‌ای یافت نشد.
            </td>
          </tr>`;
      } else {
        tbody.innerHTML = result.items.map((item) => `
          <tr>
            <td>${item.id.toLocaleString('fa-IR')}</td>
            <td><strong>${escapeHtml(item.name)}</strong></td>
            <td class="text-muted">${escapeHtml(item.description || '—')}</td>
            <td>${(item.sortOrder ?? 0).toLocaleString('fa-IR')}</td>
            <td>${renderStatusBadge(item.isActive)}</td>
            <td><span class="badge bg-light text-dark border">${item.productCount.toLocaleString('fa-IR')}</span></td>
            <td class="text-muted small">${escapeHtml(formatDate(item.createdAt))}</td>
            <td class="text-center">${renderActions(item)}</td>
          </tr>
        `).join('');
      }

      if (paginationInfo) {
        const from = result.totalItems ? (result.page - 1) * result.pageSize + 1 : 0;
        const to = Math.min(result.page * result.pageSize, result.totalItems);
        paginationInfo.textContent = `نمایش ${from.toLocaleString('fa-IR')} تا ${to.toLocaleString('fa-IR')} از ${result.totalItems.toLocaleString('fa-IR')} مورد`;
      }

      ShopAdmin.ui.renderPagination(paginationContainer, result.page, result.totalPages, (page) => {
        state.page = page;
        renderTable();
      });
    };

    const showViewModal = (id) => {
      const item = categoriesRepo().getById(id);
      if (!item) {
        ShopAdmin.ui.showToast('error', 'دسته‌بندی یافت نشد.');
        return;
      }

      const count = getProductCount(id);
      const bodyHtml = `
        <dl class="row mb-0">
          <dt class="col-sm-4">شناسه</dt><dd class="col-sm-8">${item.id.toLocaleString('fa-IR')}</dd>
          <dt class="col-sm-4">نام</dt><dd class="col-sm-8">${escapeHtml(item.name)}</dd>
          <dt class="col-sm-4">شناسه URL</dt><dd class="col-sm-8"><code dir="ltr">${escapeHtml(item.slug || '—')}</code></dd>
          <dt class="col-sm-4">توضیحات</dt><dd class="col-sm-8">${escapeHtml(item.description || '—')}</dd>
          <dt class="col-sm-4">ترتیب</dt><dd class="col-sm-8">${(item.sortOrder ?? 0).toLocaleString('fa-IR')}</dd>
          <dt class="col-sm-4">وضعیت</dt><dd class="col-sm-8">${renderStatusBadge(item.isActive)}</dd>
          <dt class="col-sm-4">تعداد محصولات</dt><dd class="col-sm-8">${count.toLocaleString('fa-IR')}</dd>
          <dt class="col-sm-4">تاریخ ایجاد</dt><dd class="col-sm-8">${escapeHtml(formatDateTime(item.createdAt))}</dd>
          <dt class="col-sm-4">آخرین ویرایش</dt><dd class="col-sm-8">${escapeHtml(formatDateTime(item.updatedAt))}</dd>
        </dl>`;

      const modal = ShopAdmin.ui.createModal({
        id: 'categoryViewModal',
        title: 'جزئیات دسته‌بندی',
        bodyHtml,
        footerHtml: `
          <a href="category-form.html?id=${item.id}" class="btn btn-primary">ویرایش</a>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">بستن</button>`
      });
      ShopAdmin.ui.showModal(modal);
    };

    const handleToggle = (id) => {
      const item = categoriesRepo().getById(id);
      if (!item) return;

      const nextActive = item.isActive === false;
      categoriesRepo().update(id, { isActive: nextActive });
      ShopAdmin.ui.showToast('success', nextActive ? 'دسته‌بندی فعال شد.' : 'دسته‌بندی غیرفعال شد.');
      renderTable();
    };

    const handleDelete = (id) => {
      const item = categoriesRepo().getById(id);
      if (!item) return;

      const count = getProductCount(id);
      if (count > 0) {
        ShopAdmin.ui.showToast('warning', `این دسته‌بندی ${count.toLocaleString('fa-IR')} محصول دارد و قابل حذف نیست.`);
        return;
      }

      ShopAdmin.ui.showConfirmModal(
        'حذف دسته‌بندی',
        `آیا از حذف «${item.name}» اطمینان دارید؟`,
        () => {
          categoriesRepo().remove(id);
          ShopAdmin.ui.showToast('success', 'دسته‌بندی حذف شد.');
          renderTable();
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
      else if (action === 'delete') handleDelete(id);
    });

    searchInput?.addEventListener('input', debounce((e) => {
      state.search = e.target.value;
      state.page = 1;
      renderTable();
    }));

    statusFilter?.addEventListener('change', (e) => {
      state.statusFilter = e.target.value;
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
    const sortInput = document.getElementById('category-sort-order');
    const activeInput = document.getElementById('category-is-active');
    const idInput = document.getElementById('category-id');
    const btnDelete = document.getElementById('btn-delete');
    const metaDates = document.getElementById('meta-dates');
    const formHeading = document.getElementById('form-heading');
    const formPageTitle = document.getElementById('form-page-title');

    let slugManual = false;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'دسته‌بندی‌ها', href: 'categories.html' },
      { label: isEdit ? 'ویرایش' : 'افزودن' }
    ]);

    if (isEdit) {
      const item = categoriesRepo().getById(editId);
      if (!item) {
        ShopAdmin.ui.showToast('error', 'دسته‌بندی یافت نشد.');
        setTimeout(() => { window.location.href = 'categories.html'; }, 1500);
        return;
      }

      idInput.value = item.id;
      nameInput.value = item.name;
      slugInput.value = item.slug || '';
      descInput.value = item.description || '';
      sortInput.value = item.sortOrder ?? 0;
      activeInput.checked = item.isActive !== false;

      document.getElementById('category-created-at').textContent = formatDateTime(item.createdAt);
      document.getElementById('category-updated-at').textContent = formatDateTime(item.updatedAt);
      metaDates.classList.remove('d-none');
      btnDelete.classList.remove('d-none');

      formHeading.textContent = 'ویرایش دسته‌بندی';
      formPageTitle.textContent = 'ویرایش دسته‌بندی';
      document.title = 'ویرایش دسته‌بندی — پنل مدیریت فروشگاه';

      if (item.slug) slugManual = true;
    }

    slugInput?.addEventListener('input', () => {
      slugManual = slugInput.value.trim().length > 0;
    });

    nameInput?.addEventListener('input', () => {
      if (!slugManual && slugInput) {
        slugInput.value = slugify(nameInput.value);
      }
    });

    btnDelete?.addEventListener('click', () => {
      const count = getProductCount(editId);
      if (count > 0) {
        ShopAdmin.ui.showToast('warning', `این دسته‌بندی ${count.toLocaleString('fa-IR')} محصول دارد و قابل حذف نیست.`);
        return;
      }

      const item = categoriesRepo().getById(editId);
      ShopAdmin.ui.showConfirmModal(
        'حذف دسته‌بندی',
        `آیا از حذف «${item?.name || ''}» اطمینان دارید؟`,
        () => {
          categoriesRepo().remove(editId);
          ShopAdmin.ui.showToast('success', 'دسته‌بندی حذف شد.');
          window.location.href = 'categories.html';
        }
      );
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();

      const allCategories = categoriesRepo().getAll();
      const excludeId = isEdit ? editId : null;

      const { valid } = validateForm(form, [
        {
          name: 'name',
          label: 'نام',
          rules: [
            (v) => validateRequired(v, 'نام'),
            (v) => validateUnique(v, allCategories, 'name', excludeId)
          ]
        },
        {
          name: 'slug',
          label: 'شناسه URL',
          rules: [
            (v) => validateSlug(v || slugify(nameInput.value)),
            (v) => validateUnique(v || slugify(nameInput.value), allCategories, 'slug', excludeId)
          ]
        },
        {
          name: 'sortOrder',
          label: 'ترتیب نمایش',
          rules: [(v) => validateSortOrder(v)]
        }
      ]);

      if (!valid) return;

      const payload = {
        name: nameInput.value.trim(),
        slug: (slugInput.value.trim() || slugify(nameInput.value)),
        description: descInput.value.trim(),
        sortOrder: Number(sortInput.value) || 0,
        isActive: activeInput.checked
      };

      if (isEdit) {
        categoriesRepo().update(editId, payload);
        ShopAdmin.ui.showToast('success', 'دسته‌بندی به‌روزرسانی شد.');
        window.location.href = 'categories.html';
      } else {
        categoriesRepo().create(payload);
        ShopAdmin.ui.showToast('success', 'دسته‌بندی جدید ثبت شد.');
        window.location.href = 'categories.html';
      }
    });
  };

  // ─── Init ────────────────────────────────────────────────────

  const init = () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    const page = window.location.pathname.split('/').pop() || '';

    if (page === 'category-form.html') {
      initCategoryForm();
    } else if (page === 'categories.html') {
      initCategoriesList();
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.ShopAdmin = window.ShopAdmin || {});
