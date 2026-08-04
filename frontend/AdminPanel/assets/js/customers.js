/**
 * customers.js — لیست و فرم مشتریان
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml, formatPrice, formatDate, formatDateTime, getStatusBadge, parseQuery, debounce, generateId } = ShopAdmin.utils;
  const { paginate, sortItems } = ShopAdmin.pagination;
  const customerRepo = ShopAdmin.storage.createRepository('customers');
  const { imageStore } = ShopAdmin.storage;

  const PAGE_SIZE = 10;
  let pendingAvatarId = null;
  let pendingAvatarBlob = null;
  let avatarPreviewUrl = null;
  let removeAvatarOnSave = false;

  const getCustomerName = (c) => `${c.firstName || ''} ${c.lastName || ''}`.trim() || '—';

  const computeCustomerStats = (customerId, orders) => {
    const customerOrders = orders.filter((o) => o.customerId === customerId);
    const totalPurchase = customerOrders
      .filter((o) => o.status === 'delivered' && o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    return { orderCount: customerOrders.length, totalPurchase };
  };

  const enrichCustomers = (customers, orders) => customers.map((c) => ({
    ...c,
    ...computeCustomerStats(c.id, orders)
  }));

  // ─── List page ───────────────────────────────────────────────

  const listState = { page: 1, filters: {} };

  const applyCustomerFilters = (customers, filters) => {
    let result = [...customers];

    if (filters.name) {
      const q = filters.name.trim().toLowerCase();
      result = result.filter((c) =>
        getCustomerName(c).toLowerCase().includes(q)
        || (c.username || '').toLowerCase().includes(q)
      );
    }
    if (filters.mobile) {
      const q = filters.mobile.trim();
      result = result.filter((c) => (c.mobile || '').includes(q));
    }
    if (filters.email) {
      const q = filters.email.trim().toLowerCase();
      result = result.filter((c) => (c.email || '').toLowerCase().includes(q));
    }
    if (filters.nationalId) {
      const q = filters.nationalId.trim();
      result = result.filter((c) => (c.nationalId || '').includes(q));
    }
    if (filters.active === 'true') result = result.filter((c) => c.isActive !== false);
    if (filters.active === 'false') result = result.filter((c) => c.isActive === false);
    if (filters.hasOrders === 'yes') result = result.filter((c) => c.orderCount > 0);
    if (filters.hasOrders === 'no') result = result.filter((c) => c.orderCount === 0);

    if (filters.sort) {
      const [field, dir] = filters.sort.split('-');
      result = sortItems(result, field, dir);
    }

    return result;
  };

  const renderCustomersList = () => {
    const tbody = document.getElementById('customers-body');
    if (!tbody) return;

    const orders = ShopAdmin.storage.createRepository('orders').getAll();
    const all = enrichCustomers(customerRepo.getAll(), orders);
    const filtered = applyCustomerFilters(all, listState.filters);
    const { items, page, totalItems, totalPages } = paginate(filtered, listState.page, PAGE_SIZE);

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted py-5"><i class="bi bi-people display-6 d-block mb-2 opacity-50"></i>مشتری‌ای یافت نشد</td></tr>';
    } else {
      tbody.innerHTML = items.map((c) => `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-2">
              <img class="rounded-circle border" width="36" height="36" alt="" data-customer-avatar="${escapeHtml(c.avatarId || '')}"
                   style="object-fit:cover;${c.avatarId ? '' : 'display:none'}">
              <span class="rounded-circle border d-inline-flex align-items-center justify-content-center text-muted bg-light"
                    style="width:36px;height:36px;${c.avatarId ? 'display:none' : ''}" data-customer-avatar-fallback>
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
          <td>${getStatusBadge(c.isActive !== false ? 'active' : 'inactive')}</td>
          <td class="text-muted small">${escapeHtml(formatDate(c.createdAt))}</td>
          <td class="no-print">
            <div class="table-actions">
              <a href="customer-form.html?id=${c.id}" class="btn btn-outline-primary" title="ویرایش">
                <i class="bi bi-pencil"></i>
              </a>
              <button type="button" class="btn btn-outline-danger" data-action="delete-customer" data-id="${c.id}" title="حذف">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    const infoEl = document.getElementById('pagination-info');
    if (infoEl) {
      infoEl.textContent = totalItems
        ? `نمایش ${((page - 1) * PAGE_SIZE + 1).toLocaleString('fa-IR')} تا ${Math.min(page * PAGE_SIZE, totalItems).toLocaleString('fa-IR')} از ${totalItems.toLocaleString('fa-IR')} مشتری`
        : '';
    }

    ShopAdmin.ui.renderPagination(document.getElementById('pagination'), page, totalPages, (p) => {
      listState.page = p;
      renderCustomersList();
    });

    tbody.querySelectorAll('[data-action="delete-customer"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        const customer = customerRepo.getById(id);
        ShopAdmin.ui.showConfirmModal(
          'حذف مشتری',
          `آیا از حذف «${getCustomerName(customer)}» مطمئن هستید؟`,
          () => {
            customerRepo.remove(id);
            ShopAdmin.ui.showToast('success', 'مشتری حذف شد.');
            renderCustomersList();
          }
        );
      });
    });
  };

  const initCustomersList = () => {
    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'مشتریان' }
    ]);

    const form = document.getElementById('filter-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        listState.filters = Object.fromEntries(fd.entries());
        listState.page = 1;
        renderCustomersList();
      });

      form.addEventListener('reset', () => {
        setTimeout(() => {
          listState.filters = {};
          listState.page = 1;
          renderCustomersList();
        }, 0);
      });

      const debouncedSearch = debounce(() => {
        const fd = new FormData(form);
        listState.filters = Object.fromEntries(fd.entries());
        listState.page = 1;
        renderCustomersList();
      }, 400);

      ['filter-name', 'filter-mobile', 'filter-email', 'filter-nationalId'].forEach((id) => {
        document.getElementById(id)?.addEventListener('input', debouncedSearch);
      });
      ['filter-active', 'filter-orders', 'filter-sort'].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', debouncedSearch);
      });
    }

    renderCustomersList();
    void hydrateCustomerAvatars();
  };

  const hydrateCustomerAvatars = async () => {
    const imgs = document.querySelectorAll('[data-customer-avatar]');
    for (const img of imgs) {
      const id = img.getAttribute('data-customer-avatar');
      if (!id) continue;
      const blob = await imageStore.getImage(id);
      if (!blob) continue;
      img.src = URL.createObjectURL(blob);
      img.style.display = '';
      const fallback = img.parentElement?.querySelector('[data-customer-avatar-fallback]');
      if (fallback) fallback.style.display = 'none';
    }
  };

  // ─── Form page ───────────────────────────────────────────────

  const setAvatarPreview = async (avatarId, blob) => {
    const preview = document.getElementById('customer-avatar-preview');
    const placeholder = document.getElementById('customer-avatar-placeholder');
    if (!preview || !placeholder) return;

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      avatarPreviewUrl = null;
    }

    if (blob) {
      avatarPreviewUrl = URL.createObjectURL(blob);
      preview.src = avatarPreviewUrl;
      preview.style.display = '';
      placeholder.style.display = 'none';
      return;
    }

    if (!avatarId) {
      preview.style.display = 'none';
      preview.src = '';
      placeholder.style.display = '';
      return;
    }

    const stored = await imageStore.getImage(avatarId);
    if (!stored) {
      preview.style.display = 'none';
      placeholder.style.display = '';
      return;
    }
    avatarPreviewUrl = URL.createObjectURL(stored);
    preview.src = avatarPreviewUrl;
    preview.style.display = '';
    placeholder.style.display = 'none';
  };

  const loadCustomerForm = async (id) => {
    const customer = customerRepo.getById(id);
    if (!customer) {
      ShopAdmin.ui.showToast('error', 'مشتری یافت نشد.');
      window.location.href = 'customers.html';
      return;
    }

    pendingAvatarId = customer.avatarId || null;
    pendingAvatarBlob = null;
    removeAvatarOnSave = false;

    document.getElementById('customer-id').value = customer.id;
    document.getElementById('firstName').value = customer.firstName || '';
    document.getElementById('lastName').value = customer.lastName || '';
    document.getElementById('username').value = customer.username || '';
    document.getElementById('email').value = customer.email || '';
    document.getElementById('mobile').value = customer.mobile || '';
    document.getElementById('phone').value = customer.phone || '';
    document.getElementById('nationalId').value = customer.nationalId || '';
    document.getElementById('postalCode').value = customer.postalCode || '';
    document.getElementById('address').value = customer.address || '';
    document.getElementById('isActive').checked = customer.isActive !== false;
    await setAvatarPreview(pendingAvatarId);

    document.getElementById('form-page-title').textContent = 'ویرایش مشتری';
    document.getElementById('form-heading').textContent = `ویرایش: ${getCustomerName(customer)}`;
    document.getElementById('delete-btn')?.classList.remove('d-none');

    const metaEl = document.getElementById('meta-info');
    if (metaEl) {
      metaEl.classList.remove('d-none');
      document.getElementById('meta-created').textContent = `عضویت: ${formatDateTime(customer.createdAt)}`;
      document.getElementById('meta-lastLogin').textContent = `آخرین ورود: ${formatDateTime(customer.lastLogin)}`;
      document.getElementById('meta-updated').textContent = `بروزرسانی: ${formatDateTime(customer.updatedAt)}`;
    }

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'مشتریان', href: 'customers.html' },
      { label: getCustomerName(customer) }
    ]);
  };

  const initCustomerForm = async () => {
    const params = parseQuery();
    const editId = params.id ? Number(params.id) : null;

    if (editId) {
      await loadCustomerForm(editId);
    } else {
      pendingAvatarId = null;
      pendingAvatarBlob = null;
      removeAvatarOnSave = false;
      ShopAdmin.ui.initBreadcrumb([
        { label: 'داشبورد', href: 'index.html' },
        { label: 'مشتریان', href: 'customers.html' },
        { label: 'مشتری جدید' }
      ]);
    }

    const form = document.getElementById('customer-form');
    if (!form) return;

    document.getElementById('customer-avatar-upload')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const err = ShopAdmin.validation.validateImageFile(file);
      if (err) {
        ShopAdmin.ui.showToast('error', err);
        e.target.value = '';
        return;
      }
      pendingAvatarBlob = file;
      pendingAvatarId = generateId('img');
      removeAvatarOnSave = false;
      await setAvatarPreview(null, file);
      e.target.value = '';
    });

    document.getElementById('customer-avatar-remove')?.addEventListener('click', async () => {
      pendingAvatarBlob = null;
      pendingAvatarId = null;
      removeAvatarOnSave = true;
      await setAvatarPreview(null);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const customers = customerRepo.getAll();
      const editIdVal = document.getElementById('customer-id').value;
      const excludeId = editIdVal ? Number(editIdVal) : null;
      const existing = excludeId ? customerRepo.getById(excludeId) : null;

      const { valid } = ShopAdmin.validation.validateForm(form, [
        { name: 'firstName', label: 'نام', rules: [(v) => ShopAdmin.validation.validateRequired(v, 'نام')] },
        { name: 'lastName', label: 'نام خانوادگی', rules: [(v) => ShopAdmin.validation.validateRequired(v, 'نام خانوادگی')] },
        { name: 'username', label: 'نام کاربری', rules: [
          (v) => ShopAdmin.validation.validateRequired(v, 'نام کاربری'),
          (v) => ShopAdmin.validation.validateUnique(v, customers, 'username', excludeId)
        ]},
        { name: 'email', label: 'ایمیل', rules: [
          (v) => ShopAdmin.validation.validateRequired(v, 'ایمیل'),
          (v) => ShopAdmin.validation.validateEmail(v),
          (v) => ShopAdmin.validation.validateUnique(v, customers, 'email', excludeId)
        ]},
        { name: 'mobile', label: 'موبایل', rules: [
          (v) => ShopAdmin.validation.validateRequired(v, 'موبایل'),
          (v) => ShopAdmin.validation.validateMobile(v),
          (v) => ShopAdmin.validation.validateUnique(v, customers, 'mobile', excludeId)
        ]},
        { name: 'phone', label: 'تلفن', rules: [(v) => ShopAdmin.validation.validatePhone(v)] },
        { name: 'nationalId', label: 'کد ملی', rules: [(v) => ShopAdmin.validation.validateNationalId(v)] }
      ]);

      if (!valid) return;

      let avatarId = existing?.avatarId || null;
      if (removeAvatarOnSave) {
        if (avatarId) await imageStore.deleteImage(avatarId).catch(() => {});
        avatarId = null;
      } else if (pendingAvatarBlob && pendingAvatarId) {
        if (existing?.avatarId) await imageStore.deleteImage(existing.avatarId).catch(() => {});
        await imageStore.saveImage(pendingAvatarId, pendingAvatarBlob);
        avatarId = pendingAvatarId;
      }

      const payload = {
        firstName: form.firstName.value.trim(),
        lastName: form.lastName.value.trim(),
        username: form.username.value.trim(),
        email: form.email.value.trim(),
        mobile: form.mobile.value.trim(),
        phone: form.phone.value.trim(),
        nationalId: form.nationalId.value.trim(),
        postalCode: form.postalCode.value.trim(),
        address: form.address.value.trim(),
        isActive: form.isActive.checked,
        avatarId
      };

      if (excludeId) {
        customerRepo.update(excludeId, payload);
        ShopAdmin.ui.showToast('success', 'مشتری بروزرسانی شد.');
        setTimeout(() => { window.location.href = 'customers.html'; }, 600);
      } else {
        customerRepo.create(payload);
        ShopAdmin.ui.showToast('success', 'مشتری جدید ثبت شد.');
        setTimeout(() => { window.location.href = 'customers.html'; }, 600);
      }
    });

    document.getElementById('delete-btn')?.addEventListener('click', () => {
      const id = Number(document.getElementById('customer-id').value);
      if (!id) return;
      const customer = customerRepo.getById(id);
      ShopAdmin.ui.showConfirmModal(
        'حذف مشتری',
        `آیا از حذف «${getCustomerName(customer)}» مطمئن هستید؟`,
        async () => {
          if (customer?.avatarId) await imageStore.deleteImage(customer.avatarId).catch(() => {});
          customerRepo.remove(id);
          ShopAdmin.ui.showToast('success', 'مشتری حذف شد.');
          window.location.href = 'customers.html';
        }
      );
    });
  };

  // ─── Init ────────────────────────────────────────────────────

  const init = () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    if (document.getElementById('customers-body')) initCustomersList();
    if (document.getElementById('customer-form')) initCustomerForm();
  };

  document.addEventListener('DOMContentLoaded', init);
})(window.ShopAdmin = window.ShopAdmin || {});
