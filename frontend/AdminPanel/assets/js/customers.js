/**
 * customers.js — لیست و فرم مشتریان — متصل به API
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml, formatPrice, formatDateTime, getStatusBadge, parseQuery, debounce } = ShopAdmin.utils;
  const { sortItems } = ShopAdmin.pagination;
  const { parseError } = window.SimpleShopHttp || {};
  const apiError = (err) => (parseError ? parseError(err) : (err?.message || 'خطا در ارتباط با سرور.'));

  const pick = (dto, camel, pascal) => dto?.[camel] ?? dto?.[pascal];

  const mapListItem = (dto) => ({
    id: pick(dto, 'id', 'Id') || '',
    firstName: pick(dto, 'firstName', 'FirstName') || '',
    lastName: pick(dto, 'lastName', 'LastName') || '',
    username: pick(dto, 'username', 'Username') || '',
    mobile: pick(dto, 'phone', 'Phone') || pick(dto, 'username', 'Username') || '',
    email: pick(dto, 'email', 'Email') || '',
    nationalId: pick(dto, 'nationalId', 'NationalId') || '',
    isActive: pick(dto, 'isActive', 'IsActive') !== false,
    orderCount: Number(pick(dto, 'orderCount', 'OrderCount')) || 0,
    totalPurchase: Number(pick(dto, 'totalPurchase', 'TotalPurchase')) || 0,
    createdAt: pick(dto, 'registerDate', 'RegisterDate') || null
  });

  const mapEditModel = (dto) => ({
    id: pick(dto, 'id', 'Id') || '',
    firstName: pick(dto, 'firstName', 'FirstName') || '',
    lastName: pick(dto, 'lastName', 'LastName') || '',
    username: pick(dto, 'username', 'Username') || '',
    email: pick(dto, 'email', 'Email') || '',
    mobile: pick(dto, 'phone', 'Phone') || pick(dto, 'username', 'Username') || '',
    phone: pick(dto, 'phone', 'Phone') || '',
    address: pick(dto, 'address', 'Address') || '',
    postalCode: pick(dto, 'postalCode', 'PostalCode') || '',
    nationalId: pick(dto, 'nationalId', 'NationalId') || '',
    isActive: pick(dto, 'isActive', 'IsActive') !== false,
    registerDate: pick(dto, 'registerDate', 'RegisterDate') || null
  });

  const toApiPayload = (form, { includePassword = false } = {}) => {
    const mobile = form.mobile.value.trim();
    const payload = {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      username: form.username.value.trim() || mobile,
      email: form.email.value.trim(),
      phone: mobile,
      address: form.address.value.trim() || null,
      postalCode: form.postalCode.value.trim() || null,
      nationalId: form.nationalId?.value.trim() || null,
      isActive: form.isActive ? form.isActive.checked : true,
      role: 'Customer'
    };
    if (includePassword) {
      payload.password = form.password?.value || '';
    }
    return payload;
  };

  const getCustomerName = (c) => `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.username || '—';

  // ─── List page ───────────────────────────────────────────────

  const initCustomersList = () => {
    const state = {
      page: 1,
      pageSize: 10,
      filters: {},
      items: [],
      totalItems: 0,
      loading: false
    };

    const tbody = document.getElementById('customers-body');
    const form = document.getElementById('filter-form');

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'مشتریان' }
    ]);

    const applyClientFilters = (items) => {
      let result = [...items];
      const { name, mobile, email, nationalId, sort } = state.filters;

      if (name) {
        const q = name.trim().toLowerCase();
        result = result.filter((c) =>
          getCustomerName(c).toLowerCase().includes(q)
          || (c.username || '').toLowerCase().includes(q)
        );
      }
      if (mobile) {
        const q = mobile.trim();
        result = result.filter((c) => (c.mobile || '').includes(q));
      }
      if (email) {
        const q = email.trim().toLowerCase();
        result = result.filter((c) => (c.email || '').toLowerCase().includes(q));
      }
      if (nationalId) {
        const q = nationalId.trim();
        result = result.filter((c) => (c.nationalId || '').includes(q));
      }

      if (sort) {
        const [field, dir] = sort.split('-');
        result = sortItems(result, field, dir);
      }

      return result;
    };

    const renderRows = (items) => {
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted py-5"><i class="bi bi-people display-6 d-block mb-2 opacity-50"></i>مشتری‌ای یافت نشد</td></tr>';
        return;
      }

      tbody.innerHTML = items.map((c) => `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-2">
              <span class="rounded-circle border d-inline-flex align-items-center justify-content-center text-muted bg-light"
                    style="width:36px;height:36px">
                <i class="bi bi-person"></i>
              </span>
              <span>${escapeHtml(getCustomerName(c))}</span>
            </div>
          </td>
          <td dir="ltr">${escapeHtml(c.username || '—')}</td>
          <td dir="ltr">${escapeHtml(c.mobile || '—')}</td>
          <td dir="ltr">${escapeHtml(c.email || '—')}</td>
          <td dir="ltr">${escapeHtml(c.nationalId || '—')}</td>
          <td>${(c.orderCount || 0).toLocaleString('fa-IR')}</td>
          <td>${escapeHtml(formatPrice(c.totalPurchase || 0))}</td>
          <td>${getStatusBadge(c.isActive ? 'active' : 'inactive')}</td>
          <td class="text-muted small">${c.createdAt ? escapeHtml(formatDateTime(c.createdAt)) : '—'}</td>
          <td class="no-print">
            <div class="table-actions">
              <a href="customer-form.html?id=${encodeURIComponent(c.id)}" class="btn btn-outline-primary" title="ویرایش">
                <i class="bi bi-pencil"></i>
              </a>
              <button type="button" class="btn btn-outline-danger" data-action="delete-customer" data-id="${escapeHtml(c.id)}" title="حذف">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('[data-action="delete-customer"]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const customer = state.items.find((x) => x.id === id);
          ShopAdmin.ui.showConfirmModal(
            'حذف مشتری',
            `آیا از حذف «${getCustomerName(customer || { username: id })}» مطمئن هستید؟`,
            async () => {
              try {
                await ShopAdmin.api.ensureApiAuth();
                await ShopAdmin.api.deleteCustomer(id);
                ShopAdmin.ui.showToast('success', 'مشتری حذف شد.');
                loadList();
              } catch (err) {
                ShopAdmin.ui.showToast('error', apiError(err));
              }
            }
          );
        });
      });
    };

    const renderPagination = (page, totalPages, totalItems) => {
      const infoEl = document.getElementById('pagination-info');
      if (infoEl) {
        infoEl.textContent = totalItems
          ? `نمایش ${((page - 1) * state.pageSize + 1).toLocaleString('fa-IR')} تا ${Math.min(page * state.pageSize, totalItems).toLocaleString('fa-IR')} از ${totalItems.toLocaleString('fa-IR')} مشتری`
          : '';
      }
      ShopAdmin.ui.renderPagination(document.getElementById('pagination'), page, totalPages, (p) => {
        state.page = p;
        loadList();
      });
    };

    const buildSearchParams = () => {
      const { name, mobile, email, nationalId, active, hasOrders } = state.filters;
      const searchTerms = [name, mobile, email, nationalId].filter(Boolean).join(' ').trim();

      let isActive;
      if (active === 'true') isActive = true;
      else if (active === 'false') isActive = false;

      let hasOrdersParam;
      if (hasOrders === 'yes') hasOrdersParam = true;
      else if (hasOrders === 'no') hasOrdersParam = false;

      return { search: searchTerms, isActive, hasOrders: hasOrdersParam };
    };

    const loadList = async () => {
      if (!tbody) return;
      state.loading = true;
      tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted py-4">در حال بارگذاری...</td></tr>';

      try {
        await ShopAdmin.api.ensureApiAuth();

        const searchParams = buildSearchParams();
        const customerData = await ShopAdmin.api.searchCustomers({
          pageIndex: state.page - 1,
          pageSize: state.pageSize,
          ...searchParams
        });

        const rawItems = customerData?.items || customerData?.Items || [];
        let items = rawItems.map(mapListItem);
        items = applyClientFilters(items);

        state.items = items;
        state.totalItems = customerData?.searchModel?.recordCount
          ?? customerData?.SearchModel?.RecordCount
          ?? items.length;

        const totalPages = Math.max(1, Math.ceil(state.totalItems / state.pageSize));
        renderRows(items);
        renderPagination(state.page, totalPages, state.totalItems);
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-danger py-4">${escapeHtml(apiError(err))}</td></tr>`;
      } finally {
        state.loading = false;
      }
    };

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        state.filters = Object.fromEntries(fd.entries());
        state.page = 1;
        loadList();
      });

      form.addEventListener('reset', () => {
        setTimeout(() => {
          state.filters = {};
          state.page = 1;
          loadList();
        }, 0);
      });

      const debouncedSearch = debounce(() => {
        const fd = new FormData(form);
        state.filters = Object.fromEntries(fd.entries());
        state.page = 1;
        loadList();
      }, 400);

      ['filter-name', 'filter-mobile', 'filter-email', 'filter-nationalId'].forEach((id) => {
        document.getElementById(id)?.addEventListener('input', debouncedSearch);
      });
      ['filter-active', 'filter-orders', 'filter-sort'].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', debouncedSearch);
      });
    }

    loadList();
  };

  // ─── Form page ───────────────────────────────────────────────

  const initCustomerForm = async () => {
    const params = parseQuery();
    const editId = params.id ? String(params.id) : null;
    const form = document.getElementById('customer-form');
    const passwordField = document.getElementById('password-field');
    const passwordInput = document.getElementById('password');
    const isActiveField = document.getElementById('isActive-field');
    const metaInfo = document.getElementById('meta-info');

    if (!form) return;

    if (editId) {
      document.getElementById('form-page-title').textContent = 'ویرایش مشتری';
      document.getElementById('delete-btn')?.classList.remove('d-none');
      passwordField?.classList.add('d-none');
      passwordInput?.removeAttribute('required');
      isActiveField?.classList.remove('d-none');

      try {
        await ShopAdmin.api.ensureApiAuth();
        const dto = await ShopAdmin.api.getCustomer(editId);
        const customer = mapEditModel(dto);

        document.getElementById('customer-id').value = customer.id;
        document.getElementById('firstName').value = customer.firstName;
        document.getElementById('lastName').value = customer.lastName;
        document.getElementById('username').value = customer.username;
        document.getElementById('email').value = customer.email;
        document.getElementById('mobile').value = customer.mobile;
        document.getElementById('phone').value = customer.phone;
        document.getElementById('postalCode').value = customer.postalCode;
        document.getElementById('address').value = customer.address;
        document.getElementById('nationalId').value = customer.nationalId;
        document.getElementById('isActive').checked = customer.isActive;

        if (customer.registerDate && metaInfo) {
          document.getElementById('meta-created').textContent =
            `تاریخ عضویت: ${formatDateTime(customer.registerDate)}`;
          metaInfo.classList.remove('d-none');
        }

        document.getElementById('form-heading').textContent = `ویرایش: ${getCustomerName(customer)}`;
        ShopAdmin.ui.initBreadcrumb([
          { label: 'داشبورد', href: 'index.html' },
          { label: 'مشتریان', href: 'customers.html' },
          { label: getCustomerName(customer) }
        ]);
      } catch (err) {
        ShopAdmin.ui.showToast('error', apiError(err));
        setTimeout(() => { window.location.href = 'customers.html'; }, 800);
        return;
      }
    } else {
      passwordField?.classList.remove('d-none');
      passwordInput?.setAttribute('required', 'required');
      isActiveField?.classList.add('d-none');
      metaInfo?.classList.add('d-none');
      ShopAdmin.ui.initBreadcrumb([
        { label: 'داشبورد', href: 'index.html' },
        { label: 'مشتریان', href: 'customers.html' },
        { label: 'مشتری جدید' }
      ]);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const rules = [
        { name: 'firstName', label: 'نام', rules: [(v) => ShopAdmin.validation.validateRequired(v, 'نام')] },
        { name: 'lastName', label: 'نام خانوادگی', rules: [(v) => ShopAdmin.validation.validateRequired(v, 'نام خانوادگی')] },
        { name: 'username', label: 'نام کاربری', rules: [(v) => ShopAdmin.validation.validateRequired(v, 'نام کاربری')] },
        { name: 'email', label: 'ایمیل', rules: [
          (v) => ShopAdmin.validation.validateRequired(v, 'ایمیل'),
          (v) => ShopAdmin.validation.validateEmail(v)
        ]},
        { name: 'mobile', label: 'موبایل', rules: [
          (v) => ShopAdmin.validation.validateRequired(v, 'موبایل'),
          (v) => ShopAdmin.validation.validateMobile(v)
        ]},
        { name: 'phone', label: 'تلفن', rules: [(v) => ShopAdmin.validation.validatePhone(v)] },
        { name: 'nationalId', label: 'کد ملی', rules: [(v) => {
          if (!v || !v.trim()) return null;
          return ShopAdmin.validation.validateNationalId(v);
        }]}
      ];

      if (!editId) {
        rules.push({
          name: 'password',
          label: 'رمز عبور',
          rules: [(v) => ShopAdmin.validation.validateRequired(v, 'رمز عبور')]
        });
      }

      const { valid } = ShopAdmin.validation.validateForm(form, rules);
      if (!valid) return;

      const idVal = document.getElementById('customer-id')?.value || '';
      const payload = toApiPayload(form, { includePassword: !idVal });

      try {
        await ShopAdmin.api.ensureApiAuth();
        if (idVal) {
          await ShopAdmin.api.updateCustomer(idVal, payload);
          ShopAdmin.ui.showToast('success', 'مشتری بروزرسانی شد.');
        } else {
          await ShopAdmin.api.createCustomer(payload);
          ShopAdmin.ui.showToast('success', 'مشتری جدید ثبت شد.');
        }
        setTimeout(() => { window.location.href = 'customers.html'; }, 600);
      } catch (err) {
        ShopAdmin.ui.showToast('error', apiError(err));
      }
    });

    document.getElementById('delete-btn')?.addEventListener('click', () => {
      const id = document.getElementById('customer-id')?.value;
      if (!id) return;
      ShopAdmin.ui.showConfirmModal(
        'حذف مشتری',
        'آیا از حذف این مشتری مطمئن هستید؟',
        async () => {
          try {
            await ShopAdmin.api.ensureApiAuth();
            await ShopAdmin.api.deleteCustomer(id);
            ShopAdmin.ui.showToast('success', 'مشتری حذف شد.');
            window.location.href = 'customers.html';
          } catch (err) {
            ShopAdmin.ui.showToast('error', apiError(err));
          }
        }
      );
    });
  };

  const init = () => {
    if (!ShopAdmin.auth.requireAuth()) return;
    if (document.getElementById('customers-body')) initCustomersList();
    if (document.getElementById('customer-form')) void initCustomerForm();
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.ShopAdmin = window.ShopAdmin || {});
