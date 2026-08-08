/**
 * suppliers.js — مدیریت تأمین‌کنندگان (لیست + فرم) — متصل به API
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml, formatDate, formatDateTime, debounce, parseQuery } = ShopAdmin.utils;
  const { sortItems } = ShopAdmin.pagination;
  const {
    validateRequired,
    validateEmail,
    validatePhone,
    validateMobile,
    validateForm
  } = ShopAdmin.validation;
  const { parseError } = window.SimpleShopHttp || {};
  const apiError = (err) => (parseError ? parseError(err) : (err?.message || 'خطا در ارتباط با سرور.'));

  const pick = (dto, camel, pascal) => dto?.[camel] ?? dto?.[pascal];

  const mapListItem = (dto) => ({
    id: pick(dto, 'id', 'Id'),
    name: pick(dto, 'name', 'Name') || '',
    contactPerson: pick(dto, 'contactPerson', 'ContactPerson') || '',
    phone: pick(dto, 'phone', 'Phone') || '',
    mobile: pick(dto, 'mobile', 'Mobile') || '',
    email: pick(dto, 'email', 'Email') || '',
    address: pick(dto, 'address', 'Address') || '',
    description: pick(dto, 'description', 'Description') || '',
    isActive: pick(dto, 'isActive', 'IsActive') !== false,
    productCount: pick(dto, 'productCount', 'ProductCount') ?? 0,
    createdAt: pick(dto, 'createdAt', 'CreatedAt') || null,
    updatedAt: pick(dto, 'updatedAt', 'UpdatedAt') || null
  });

  const mapEditModel = (dto) => mapListItem(dto);

  const toApiPayload = (form) => ({
    name: form.name,
    contactPerson: form.contactPerson || null,
    phone: form.phone || null,
    email: form.email || null,
    address: form.address || null
  });

  // ─── List Page ───────────────────────────────────────────────

  const initSuppliersList = () => {
    const state = {
      search: '',
      statusFilter: 'all',
      sortField: 'name',
      sortDir: 'asc',
      page: 1,
      pageSize: 10,
      totalItems: 0,
      loading: false,
      items: []
    };

    const tbody = document.getElementById('suppliers-tbody');
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const pageSizeSelect = document.getElementById('page-size-select');
    const paginationInfo = document.getElementById('pagination-info');
    const paginationContainer = document.getElementById('pagination-container');
    const table = document.getElementById('suppliers-table');

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'تأمین‌کنندگان' }
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
        <button type="button" class="btn btn-outline-primary" data-action="products" data-id="${item.id}" title="محصولات (${item.productCount.toLocaleString('fa-IR')})">
          <i class="bi bi-box-seam"></i>
        </button>
        <a href="supplier-form.html?id=${item.id}" class="btn btn-outline-primary" title="ویرایش">
          <i class="bi bi-pencil"></i>
        </a>
        <button type="button" class="btn btn-outline-warning" data-action="toggle" data-id="${item.id}" title="تغییر وضعیت">
          <i class="bi bi-toggle-${item.isActive ? 'on' : 'off'}"></i>
        </button>
        <button type="button" class="btn btn-outline-danger" data-action="delete" data-id="${item.id}" title="حذف">
          <i class="bi bi-trash"></i>
        </button>
      </div>`;

    const { formatPrice } = ShopAdmin.utils;

    const showProductsModal = async (id) => {
      const item = state.items.find((s) => s.id === id);
      if (!item) {
        ShopAdmin.ui.showToast('error', 'تأمین‌کننده یافت نشد.');
        return;
      }

      let products = [];
      try {
        await ShopAdmin.api.ensureApiAuth();
        const data = await ShopAdmin.api.getProducts({ page: 1, pageSize: 100 });
        products = (data?.items || data?.Items || [])
          .filter((p) => (pick(p, 'supplierId', 'SupplierId')) === id)
          .map((p) => ({
            id: pick(p, 'id', 'Id'),
            name: pick(p, 'name', 'Name') || '—',
            price: Number(pick(p, 'price', 'Price')) || 0,
            stock: Number(pick(p, 'stock', 'Stock')) || 0,
            isActive: pick(p, 'isActive', 'IsActive') !== false
          }));
      } catch (err) {
        ShopAdmin.ui.showToast('error', apiError(err));
        return;
      }

      let bodyHtml;
      if (!products.length) {
        bodyHtml = `
          <div class="text-center text-muted py-4">
            <i class="bi bi-box-seam display-6 d-block mb-2 opacity-50"></i>
            <p class="mb-0">این تأمین‌کننده هنوز محصولی ندارد.</p>
          </div>`;
      } else {
        const rows = products
          .slice()
          .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'fa'))
          .map((p, i) => `
            <tr>
              <td>${(i + 1).toLocaleString('fa-IR')}</td>
              <td><a href="product-form.html?id=${p.id}">${escapeHtml(p.name || '—')}</a></td>
              <td>${escapeHtml(formatPrice(p.price))}</td>
              <td>${(Number(p.stock) || 0).toLocaleString('fa-IR')}</td>
              <td>${p.isActive !== false
                ? '<span class="badge bg-success">فعال</span>'
                : '<span class="badge bg-secondary">غیرفعال</span>'}</td>
            </tr>`)
          .join('');

        bodyHtml = `
          <p class="text-muted small mb-3">
            تعداد محصولات «${escapeHtml(item.name)}»:
            <strong>${products.length.toLocaleString('fa-IR')}</strong>
          </p>
          <div class="table-responsive">
            <table class="table admin-table mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>نام</th>
                  <th>قیمت</th>
                  <th>موجودی</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>`;
      }

      const modal = ShopAdmin.ui.createModal({
        id: 'supplierProductsModal',
        title: `محصولات ${item.name}`,
        size: 'lg',
        bodyHtml,
        footerHtml: `
          <a href="products.html?supplierId=${item.id}" class="btn btn-primary">
            <i class="bi bi-box-seam"></i> محصولات
          </a>
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">بستن</button>`
      });
      ShopAdmin.ui.showModal(modal);
    };

    const renderTable = async () => {
      if (state.loading) return;
      state.loading = true;
      tbody.innerHTML = `
        <tr><td colspan="10" class="text-center text-muted py-5">
          <span class="spinner-border spinner-border-sm me-2"></span>در حال بارگذاری...
        </td></tr>`;

      try {
        await ShopAdmin.api.ensureApiAuth();
        const data = await ShopAdmin.api.searchSuppliers({
          pageIndex: state.page - 1,
          pageSize: state.pageSize,
          search: state.search.trim()
        });

        const searchModel = data?.searchModel || data?.SearchModel || {};
        state.totalItems = Number(searchModel.recordCount ?? searchModel.RecordCount ?? 0);

        state.items = (data?.items || data?.Items || []).map(mapListItem);
        let items = applyStatusFilter(state.items);
        items = sortItems(items, state.sortField, state.sortDir);

        if (!items.length) {
          tbody.innerHTML = `
            <tr>
              <td colspan="10" class="text-center text-muted py-5">
                <i class="bi bi-truck display-6 d-block mb-2 opacity-50"></i>
                تأمین‌کننده‌ای یافت نشد.
              </td>
            </tr>`;
        } else {
          tbody.innerHTML = items.map((item) => `
            <tr>
              <td class="col-id">${item.id.toLocaleString('fa-IR')}</td>
              <td class="col-name"><strong class="supplier-name-cell" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</strong></td>
              <td class="col-contact">${escapeHtml(item.contactPerson || '—')}</td>
              <td class="col-phone" dir="ltr">${escapeHtml(item.phone || '—')}</td>
              <td class="col-mobile" dir="ltr">${escapeHtml(item.mobile || '—')}</td>
              <td class="col-email" dir="ltr">${escapeHtml(item.email || '—')}</td>
              <td class="col-status">${renderStatusBadge(item.isActive)}</td>
              <td class="col-products">
                <button type="button" class="supplier-product-count" data-action="products" data-id="${item.id}" title="مشاهده محصولات">
                  ${item.productCount.toLocaleString('fa-IR')}
                </button>
              </td>
              <td class="col-date">${escapeHtml(item.createdAt ? formatDate(item.createdAt) : '—')}</td>
              <td class="col-actions">${renderActions(item)}</td>
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
          <tr><td colspan="10" class="text-center text-danger py-5">${escapeHtml(apiError(err))}</td></tr>`;
        ShopAdmin.ui.showToast('error', apiError(err));
      } finally {
        state.loading = false;
      }
    };

    const showViewModal = async (id) => {
      try {
        await ShopAdmin.api.ensureApiAuth();
        const dto = await ShopAdmin.api.getSupplier(id);
        const item = mapEditModel(dto);

        const bodyHtml = `
          <dl class="row mb-0">
            <dt class="col-sm-4">شناسه</dt><dd class="col-sm-8">${item.id.toLocaleString('fa-IR')}</dd>
            <dt class="col-sm-4">نام</dt><dd class="col-sm-8">${escapeHtml(item.name)}</dd>
            <dt class="col-sm-4">مسئول تماس</dt><dd class="col-sm-8">${escapeHtml(item.contactPerson || '—')}</dd>
            <dt class="col-sm-4">تلفن</dt><dd class="col-sm-8" dir="ltr">${escapeHtml(item.phone || '—')}</dd>
            <dt class="col-sm-4">موبایل</dt><dd class="col-sm-8" dir="ltr">${escapeHtml(item.mobile || '—')}</dd>
            <dt class="col-sm-4">ایمیل</dt><dd class="col-sm-8" dir="ltr">${escapeHtml(item.email || '—')}</dd>
            <dt class="col-sm-4">آدرس</dt><dd class="col-sm-8">${escapeHtml(item.address || '—')}</dd>
            <dt class="col-sm-4">وضعیت</dt><dd class="col-sm-8">${renderStatusBadge(item.isActive)}</dd>
            <dt class="col-sm-4">تعداد محصولات</dt><dd class="col-sm-8">${item.productCount.toLocaleString('fa-IR')}</dd>
          </dl>`;

        const modal = ShopAdmin.ui.createModal({
          id: 'supplierViewModal',
          title: 'جزئیات تأمین‌کننده',
          bodyHtml,
          footerHtml: `
            <button type="button" class="btn btn-outline-primary" data-action="products" data-id="${item.id}" id="supplier-view-products-btn">
              <i class="bi bi-box-seam"></i> محصولات (${item.productCount.toLocaleString('fa-IR')})
            </button>
            <a href="supplier-form.html?id=${item.id}" class="btn btn-primary">ویرایش</a>
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">بستن</button>`
        });
        ShopAdmin.ui.showModal(modal);
        modal.querySelector('#supplier-view-products-btn')?.addEventListener('click', () => {
          ShopAdmin.ui.hideModal(modal);
          showProductsModal(id);
        });
      } catch (err) {
        ShopAdmin.ui.showToast('error', apiError(err));
      }
    };

    const handleToggle = (id) => {
      ShopAdmin.ui.showToast('info', 'تغییر isActive در API پشتیبانی نمی‌شود؛ همه به‌عنوان فعال نمایش داده می‌شوند.');
    };

    const handleDelete = (id) => {
      const item = state.items.find((s) => s.id === id);
      if (!item) return;

      if (item.productCount > 0) {
        ShopAdmin.ui.showToast('warning', `این تأمین‌کننده ${item.productCount.toLocaleString('fa-IR')} محصول دارد و قابل حذف نیست.`);
        return;
      }

      ShopAdmin.ui.showConfirmModal(
        'حذف تأمین‌کننده',
        `آیا از حذف «${item.name}» اطمینان دارید؟`,
        async () => {
          try {
            await ShopAdmin.api.ensureApiAuth();
            await ShopAdmin.api.deleteSupplier(id);
            ShopAdmin.ui.showToast('success', 'تأمین‌کننده حذف شد.');
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
      else if (action === 'products') showProductsModal(id);
      else if (action === 'toggle') handleToggle(id);
      else if (action === 'delete') handleDelete(id);
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

  const initSupplierForm = () => {
    const query = parseQuery();
    const editId = query.id ? Number(query.id) : null;
    const isEdit = editId != null && !Number.isNaN(editId);

    const form = document.getElementById('supplier-form');
    const nameInput = document.getElementById('supplier-name');
    const contactInput = document.getElementById('supplier-contact');
    const phoneInput = document.getElementById('supplier-phone');
    const mobileInput = document.getElementById('supplier-mobile');
    const emailInput = document.getElementById('supplier-email');
    const addressInput = document.getElementById('supplier-address');
    const descInput = document.getElementById('supplier-description');
    const activeInput = document.getElementById('supplier-is-active');
    const btnDelete = document.getElementById('btn-delete');
    const metaDates = document.getElementById('meta-dates');
    const formHeading = document.getElementById('form-heading');
    const formPageTitle = document.getElementById('form-page-title');

    let loadedItem = null;
    let isSubmitting = false;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'تأمین‌کنندگان', href: 'suppliers.html' },
      { label: isEdit ? 'ویرایش' : 'افزودن' }
    ]);

    const loadForm = async () => {
      if (!isEdit) return;

      try {
        await ShopAdmin.api.ensureApiAuth();
        const dto = await ShopAdmin.api.getSupplier(editId);
        loadedItem = mapEditModel(dto);
        if (!loadedItem.id) {
          ShopAdmin.ui.showToast('error', 'تأمین‌کننده یافت نشد.');
          setTimeout(() => { window.location.href = 'suppliers.html'; }, 1500);
          return;
        }

        document.getElementById('supplier-id').value = loadedItem.id;
        nameInput.value = loadedItem.name;
        contactInput.value = loadedItem.contactPerson || '';
        phoneInput.value = loadedItem.phone || '';
        mobileInput.value = loadedItem.mobile || '';
        emailInput.value = loadedItem.email || '';
        addressInput.value = loadedItem.address || '';
        descInput.value = loadedItem.description || '';
        activeInput.checked = loadedItem.isActive;

        if (loadedItem.createdAt) {
          document.getElementById('supplier-created-at').textContent = formatDateTime(loadedItem.createdAt);
        }
        if (loadedItem.updatedAt) {
          document.getElementById('supplier-updated-at').textContent = formatDateTime(loadedItem.updatedAt);
        }
        metaDates?.classList.remove('d-none');
        btnDelete?.classList.remove('d-none');

        formHeading.textContent = 'ویرایش تأمین‌کننده';
        formPageTitle.textContent = 'ویرایش تأمین‌کننده';
        document.title = 'ویرایش تأمین‌کننده — پنل مدیریت فروشگاه';
      } catch (err) {
        ShopAdmin.ui.showToast('error', apiError(err));
      }
    };

    btnDelete?.addEventListener('click', () => {
      if ((loadedItem?.productCount || 0) > 0) {
        ShopAdmin.ui.showToast('warning', `این تأمین‌کننده ${loadedItem.productCount.toLocaleString('fa-IR')} محصول دارد و قابل حذف نیست.`);
        return;
      }

      ShopAdmin.ui.showConfirmModal(
        'حذف تأمین‌کننده',
        `آیا از حذف «${loadedItem?.name || ''}» اطمینان دارید؟`,
        async () => {
          try {
            await ShopAdmin.api.ensureApiAuth();
            await ShopAdmin.api.deleteSupplier(editId);
            ShopAdmin.ui.showToast('success', 'تأمین‌کننده حذف شد.');
            window.location.href = 'suppliers.html';
          } catch (err) {
            ShopAdmin.ui.showToast('error', apiError(err));
          }
        }
      );
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      const { valid } = validateForm(form, [
        {
          name: 'name',
          label: 'نام',
          rules: [(v) => validateRequired(v, 'نام شرکت')]
        },
        {
          name: 'email',
          label: 'ایمیل',
          rules: [(v) => validateEmail(v)]
        },
        {
          name: 'phone',
          label: 'تلفن',
          rules: [(v) => validatePhone(v)]
        },
        {
          name: 'mobile',
          label: 'موبایل',
          rules: [(v) => validateMobile(v)]
        }
      ]);

      if (!valid) return;

      const payload = toApiPayload({
        name: nameInput.value.trim(),
        contactPerson: contactInput.value.trim(),
        phone: phoneInput.value.trim(),
        email: emailInput.value.trim(),
        address: addressInput.value.trim()
      });

      isSubmitting = true;
      try {
        await ShopAdmin.api.ensureApiAuth();
        if (isEdit) await ShopAdmin.api.updateSupplier(editId, payload);
        else await ShopAdmin.api.createSupplier(payload);

        ShopAdmin.ui.showToast('success', isEdit ? 'تأمین‌کننده به‌روزرسانی شد.' : 'تأمین‌کننده جدید ثبت شد.');
        window.location.href = 'suppliers.html';
      } catch (err) {
        ShopAdmin.ui.showToast('error', apiError(err));
      } finally {
        isSubmitting = false;
      }
    });

    loadForm();
  };

  // ─── Init ────────────────────────────────────────────────────

  const init = () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    if (document.getElementById('supplier-form')) {
      initSupplierForm();
    } else if (document.getElementById('suppliers-table') || document.getElementById('suppliers-tbody')) {
      initSuppliersList();
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.ShopAdmin = window.ShopAdmin || {});
