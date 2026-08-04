/**
 * suppliers.js — مدیریت تأمین‌کنندگان (لیست + فرم)
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml, formatDate, formatDateTime, debounce, parseQuery } = ShopAdmin.utils;
  const { paginate, sortItems } = ShopAdmin.pagination;
  const {
    validateRequired,
    validateUnique,
    validateEmail,
    validatePhone,
    validateMobile,
    validateForm
  } = ShopAdmin.validation;

  const suppliersRepo = () => ShopAdmin.storage.createRepository('suppliers');
  const productsRepo = () => ShopAdmin.storage.createRepository('products');

  const getProductCount = (supplierId) =>
    productsRepo().getAll().filter((p) => p.supplierId === supplierId).length;

  const enrichSuppliers = (items) =>
    items.map((item) => ({ ...item, productCount: getProductCount(item.id) }));

  // ─── List Page ───────────────────────────────────────────────

  const initSuppliersList = () => {
    const state = {
      search: '',
      statusFilter: 'all',
      sortField: 'name',
      sortDir: 'asc',
      page: 1,
      pageSize: 10
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

    const filterItems = (items) => {
      let filtered = enrichSuppliers(items);

      if (state.search) {
        const q = state.search.trim().toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            (item.contactPerson || '').toLowerCase().includes(q) ||
            (item.email || '').toLowerCase().includes(q) ||
            (item.phone || '').includes(q) ||
            (item.mobile || '').includes(q) ||
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
          <i class="bi bi-toggle-${item.isActive !== false ? 'on' : 'off'}"></i>
        </button>
        <button type="button" class="btn btn-outline-danger" data-action="delete" data-id="${item.id}" title="حذف">
          <i class="bi bi-trash"></i>
        </button>
      </div>`;

    const { formatPrice } = ShopAdmin.utils;

    const showProductsModal = (id) => {
      const item = suppliersRepo().getById(id);
      if (!item) {
        ShopAdmin.ui.showToast('error', 'تأمین‌کننده یافت نشد.');
        return;
      }

      const products = productsRepo().getAll().filter((p) => p.supplierId === id);
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
              <td>${escapeHtml(p.sku || '—')}</td>
              <td><a href="product-form.html?id=${p.id}">${escapeHtml(p.name || '—')}</a></td>
              <td>${escapeHtml(formatPrice(p.discountPrice ?? p.price))}</td>
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
                  <th>کد</th>
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

    const renderTable = () => {
      const all = suppliersRepo().getAll();
      const filtered = filterItems(all);
      const sorted = sortItems(filtered, state.sortField, state.sortDir);
      const result = paginate(sorted, state.page, state.pageSize);

      if (!result.items.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="10" class="text-center text-muted py-5">
              <i class="bi bi-truck display-6 d-block mb-2 opacity-50"></i>
              تأمین‌کننده‌ای یافت نشد.
            </td>
          </tr>`;
      } else {
        tbody.innerHTML = result.items.map((item) => `
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
            <td class="col-date">${escapeHtml(formatDate(item.createdAt))}</td>
            <td class="col-actions">${renderActions(item)}</td>
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
      const item = suppliersRepo().getById(id);
      if (!item) {
        ShopAdmin.ui.showToast('error', 'تأمین‌کننده یافت نشد.');
        return;
      }

      const count = getProductCount(id);
      const bodyHtml = `
        <dl class="row mb-0">
          <dt class="col-sm-4">شناسه</dt><dd class="col-sm-8">${item.id.toLocaleString('fa-IR')}</dd>
          <dt class="col-sm-4">نام</dt><dd class="col-sm-8">${escapeHtml(item.name)}</dd>
          <dt class="col-sm-4">مسئول تماس</dt><dd class="col-sm-8">${escapeHtml(item.contactPerson || '—')}</dd>
          <dt class="col-sm-4">تلفن</dt><dd class="col-sm-8" dir="ltr">${escapeHtml(item.phone || '—')}</dd>
          <dt class="col-sm-4">موبایل</dt><dd class="col-sm-8" dir="ltr">${escapeHtml(item.mobile || '—')}</dd>
          <dt class="col-sm-4">ایمیل</dt><dd class="col-sm-8" dir="ltr">${escapeHtml(item.email || '—')}</dd>
          <dt class="col-sm-4">آدرس</dt><dd class="col-sm-8">${escapeHtml(item.address || '—')}</dd>
          <dt class="col-sm-4">توضیحات</dt><dd class="col-sm-8">${escapeHtml(item.description || '—')}</dd>
          <dt class="col-sm-4">وضعیت</dt><dd class="col-sm-8">${renderStatusBadge(item.isActive)}</dd>
          <dt class="col-sm-4">تعداد محصولات</dt><dd class="col-sm-8">${count.toLocaleString('fa-IR')}</dd>
          <dt class="col-sm-4">تاریخ ایجاد</dt><dd class="col-sm-8">${escapeHtml(formatDateTime(item.createdAt))}</dd>
          <dt class="col-sm-4">آخرین ویرایش</dt><dd class="col-sm-8">${escapeHtml(formatDateTime(item.updatedAt))}</dd>
        </dl>`;

      const modal = ShopAdmin.ui.createModal({
        id: 'supplierViewModal',
        title: 'جزئیات تأمین‌کننده',
        bodyHtml,
        footerHtml: `
          <button type="button" class="btn btn-outline-primary" data-action="products" data-id="${item.id}" id="supplier-view-products-btn">
            <i class="bi bi-box-seam"></i> محصولات (${count.toLocaleString('fa-IR')})
          </button>
          <a href="supplier-form.html?id=${item.id}" class="btn btn-primary">ویرایش</a>
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">بستن</button>`
      });
      ShopAdmin.ui.showModal(modal);
      modal.querySelector('#supplier-view-products-btn')?.addEventListener('click', () => {
        ShopAdmin.ui.hideModal(modal);
        showProductsModal(id);
      });
    };

    const handleToggle = (id) => {
      const item = suppliersRepo().getById(id);
      if (!item) return;

      const nextActive = item.isActive === false;
      suppliersRepo().update(id, { isActive: nextActive });
      ShopAdmin.ui.showToast('success', nextActive ? 'تأمین‌کننده فعال شد.' : 'تأمین‌کننده غیرفعال شد.');
      renderTable();
    };

    const handleDelete = (id) => {
      const item = suppliersRepo().getById(id);
      if (!item) return;

      const count = getProductCount(id);
      if (count > 0) {
        ShopAdmin.ui.showToast('warning', `این تأمین‌کننده ${count.toLocaleString('fa-IR')} محصول دارد و قابل حذف نیست.`);
        return;
      }

      ShopAdmin.ui.showConfirmModal(
        'حذف تأمین‌کننده',
        `آیا از حذف «${item.name}» اطمینان دارید؟`,
        () => {
          suppliersRepo().remove(id);
          ShopAdmin.ui.showToast('success', 'تأمین‌کننده حذف شد.');
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
      else if (action === 'products') showProductsModal(id);
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

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'تأمین‌کنندگان', href: 'suppliers.html' },
      { label: isEdit ? 'ویرایش' : 'افزودن' }
    ]);

    if (isEdit) {
      const item = suppliersRepo().getById(editId);
      if (!item) {
        ShopAdmin.ui.showToast('error', 'تأمین‌کننده یافت نشد.');
        setTimeout(() => { window.location.href = 'suppliers.html'; }, 1500);
        return;
      }

      document.getElementById('supplier-id').value = item.id;
      nameInput.value = item.name;
      contactInput.value = item.contactPerson || '';
      phoneInput.value = item.phone || '';
      mobileInput.value = item.mobile || '';
      emailInput.value = item.email || '';
      addressInput.value = item.address || '';
      descInput.value = item.description || '';
      activeInput.checked = item.isActive !== false;

      document.getElementById('supplier-created-at').textContent = formatDateTime(item.createdAt);
      document.getElementById('supplier-updated-at').textContent = formatDateTime(item.updatedAt);
      metaDates.classList.remove('d-none');
      btnDelete.classList.remove('d-none');

      formHeading.textContent = 'ویرایش تأمین‌کننده';
      formPageTitle.textContent = 'ویرایش تأمین‌کننده';
      document.title = 'ویرایش تأمین‌کننده — پنل مدیریت فروشگاه';
    }

    btnDelete?.addEventListener('click', () => {
      const count = getProductCount(editId);
      if (count > 0) {
        ShopAdmin.ui.showToast('warning', `این تأمین‌کننده ${count.toLocaleString('fa-IR')} محصول دارد و قابل حذف نیست.`);
        return;
      }

      const item = suppliersRepo().getById(editId);
      ShopAdmin.ui.showConfirmModal(
        'حذف تأمین‌کننده',
        `آیا از حذف «${item?.name || ''}» اطمینان دارید؟`,
        () => {
          suppliersRepo().remove(editId);
          ShopAdmin.ui.showToast('success', 'تأمین‌کننده حذف شد.');
          window.location.href = 'suppliers.html';
        }
      );
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();

      const allSuppliers = suppliersRepo().getAll();
      const excludeId = isEdit ? editId : null;

      const { valid } = validateForm(form, [
        {
          name: 'name',
          label: 'نام',
          rules: [
            (v) => validateRequired(v, 'نام شرکت'),
            (v) => validateUnique(v, allSuppliers, 'name', excludeId)
          ]
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

      const payload = {
        name: nameInput.value.trim(),
        contactPerson: contactInput.value.trim(),
        phone: phoneInput.value.trim(),
        mobile: mobileInput.value.trim(),
        email: emailInput.value.trim(),
        address: addressInput.value.trim(),
        description: descInput.value.trim(),
        isActive: activeInput.checked
      };

      if (isEdit) {
        suppliersRepo().update(editId, payload);
        ShopAdmin.ui.showToast('success', 'تأمین‌کننده به‌روزرسانی شد.');
        window.location.href = 'suppliers.html';
      } else {
        suppliersRepo().create(payload);
        ShopAdmin.ui.showToast('success', 'تأمین‌کننده جدید ثبت شد.');
        window.location.href = 'suppliers.html';
      }
    });
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
