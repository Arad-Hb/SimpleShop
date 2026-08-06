/**
 * customers.js — لیست و فرم مشتریان — متصل به API
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml, formatPrice, parseQuery, debounce } = ShopAdmin.utils;
  const { sortItems } = ShopAdmin.pagination;
  const { parseError } = window.SimpleShopHttp || {};
  const apiError = (err) => (parseError ? parseError(err) : (err?.message || 'خطا در ارتباط با سرور.'));

  const pick = (dto, camel, pascal) => dto?.[camel] ?? dto?.[pascal];

  const splitFullName = (fullName) => {
    const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { firstName: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  };

  const mapListItem = (dto) => {
    const fullName = pick(dto, 'fullName', 'FullName') || '';
    const { firstName, lastName } = splitFullName(fullName);
    const phone = pick(dto, 'phone', 'Phone') || '';
    const username = pick(dto, 'username', 'Username') || '';
    return {
      id: pick(dto, 'id', 'Id') || '',
      firstName,
      lastName,
      username,
      mobile: phone || username,
      email: pick(dto, 'email', 'Email') || '',
      nationalId: '',
      isActive: true,
      orderCount: 0,
      totalPurchase: 0,
      createdAt: null
    };
  };

  const mapEditModel = (dto) => ({
    id: pick(dto, 'id', 'Id') || '',
    firstName: pick(dto, 'firstName', 'FirstName') || '',
    lastName: pick(dto, 'lastName', 'LastName') || '',
    username: pick(dto, 'username', 'Username') || '',
    email: pick(dto, 'email', 'Email') || '',
    mobile: pick(dto, 'phone', 'Phone') || pick(dto, 'username', 'Username') || '',
    phone: pick(dto, 'phone', 'Phone') || '',
    address: pick(dto, 'address', 'Address') || '',
    postalCode: pick(dto, 'postalCode', 'PostalCode') || ''
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
      role: 'Customer'
    };
    if (includePassword) {
      payload.password = form.password?.value || '';
    }
    return payload;
  };

  const enrichWithOrderStats = (customers, orders) => {
    const byUser = new Map();
    (orders || []).forEach((o) => {
      const userId = pick(o, 'userId', 'UserId');
      if (!userId) return;
      if (!byUser.has(userId)) byUser.set(userId, []);
      byUser.get(userId).push(o);
    });

    return customers.map((c) => {
      const userOrders = byUser.get(c.id) || [];
      const totalPurchase = userOrders
        .filter((o) => (pick(o, 'status', 'Status') || '') === 'delivered')
        .reduce((sum, o) => sum + (Number(pick(o, 'totalAmount', 'TotalAmount')) || 0), 0);
      return {
        ...c,
        orderCount: userOrders.length,
        totalPurchase
      };
    });
  };

  const getCustomerName = (c) => `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.username || '—';

  // ─── List page ───────────────────────────────────────────────

  const initCustomersList = () => {
    const state = {
      page: 1,
      pageSize: 10,
      search: '',
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
      const { name, mobile, email, active, hasOrders } = state.filters;

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
      if (active === 'true') result = result.filter((c) => c.isActive);
      if (active === 'false') result = result.filter((c) => !c.isActive);
      if (hasOrders === 'yes') result = result.filter((c) => c.orderCount > 0);
      if (hasOrders === 'no') result = result.filter((c) => c.orderCount === 0);

      if (state.filters.sort) {
        const [field, dir] = state.filters.sort.split('-');
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
          <td dir="ltr">—</td>
          <td>${(c.orderCount || 0).toLocaleString('fa-IR')}</td>
          <td>${escapeHtml(formatPrice(c.totalPurchase || 0))}</td>
          <td><span class="badge bg-success">فعال</span></td>
          <td class="text-muted small">—</td>
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

    const loadList = async () => {
      if (!tbody) return;
      state.loading = true;
      tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted py-4">در حال بارگذاری...</td></tr>';

      try {
        await ShopAdmin.api.ensureApiAuth();

        const searchTerms = [
          state.filters.name,
          state.filters.mobile,
          state.filters.email
        ].filter(Boolean).join(' ').trim();

        const [customerData, orderData] = await Promise.all([
          ShopAdmin.api.searchCustomers({
            pageIndex: state.page - 1,
            pageSize: state.pageSize,
            search: searchTerms || state.search
          }),
          ShopAdmin.api.searchOrders({ pageIndex: 0, pageSize: 500 })
        ]);

        const rawItems = customerData?.items || customerData?.Items || [];
        let items = enrichWithOrderStats(rawItems.map(mapListItem), orderData?.items || orderData?.Items || []);
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

      ['filter-name', 'filter-mobile', 'filter-email'].forEach((id) => {
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

    if (!form) return;

    if (editId) {
      document.getElementById('form-page-title').textContent = 'ویرایش مشتری';
      document.getElementById('delete-btn')?.classList.remove('d-none');
      passwordField?.classList.add('d-none');
      passwordInput?.removeAttribute('required');

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
        { name: 'phone', label: 'تلفن', rules: [(v) => ShopAdmin.validation.validatePhone(v)] }
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
