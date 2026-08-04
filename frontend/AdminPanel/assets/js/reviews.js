/**
 * reviews.js — مدیریت نظرات و امتیازها
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml, formatDateTime, getStatusBadge, debounce } = ShopAdmin.utils;
  const { paginate, sortItems } = ShopAdmin.pagination;
  const { recalculateProductRating } = ShopAdmin.storage;

  const reviewRepo = ShopAdmin.storage.createRepository('reviews');

  let allReviews = [];
  let products = [];
  let customers = [];
  let adminProfile = {};
  let filters = {
    search: '',
    status: '',
    rating: '',
    productId: '',
    customerId: '',
    dateFrom: '',
    dateTo: ''
  };
  let sortField = 'createdAt';
  let sortDir = 'desc';
  let currentPage = 1;
  const pageSize = 10;
  let selectedIds = new Set();
  let currentReviewId = null;
  let pendingRejectIds = [];

  const renderStars = (rating) => {
    const r = Number(rating) || 0;
    return `<span class="text-warning" aria-label="${r} از ۵">${'★'.repeat(r)}${'☆'.repeat(5 - r)}</span>`;
  };

  const getProductName = (productId) => {
    const p = products.find((x) => x.id === productId);
    return p ? p.name : '—';
  };

  const getCustomerName = (customerId) => {
    const c = customers.find((x) => x.id === customerId);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };

  const getReviewerName = () => adminProfile?.fullName || 'مدیر';

  const applyFilters = (reviews) => reviews.filter((r) => {
    if (filters.status && r.status !== filters.status) return false;
    if (filters.rating && Number(r.rating) !== Number(filters.rating)) return false;
    if (filters.productId && r.productId !== Number(filters.productId)) return false;
    if (filters.customerId && r.customerId !== Number(filters.customerId)) return false;

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      if (new Date(r.createdAt) < from) return false;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(r.createdAt) > to) return false;
    }

    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      const haystack = [
        r.title, r.body, getProductName(r.productId), getCustomerName(r.customerId)
      ].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  const updateBulkButtons = () => {
    const count = selectedIds.size;
    const approveBtn = document.getElementById('btn-bulk-approve');
    const rejectBtn = document.getElementById('btn-bulk-reject');
    if (approveBtn) approveBtn.disabled = count === 0;
    if (rejectBtn) rejectBtn.disabled = count === 0;
  };

  const renderTable = () => {
    const tbody = document.getElementById('reviews-body');
    const summaryEl = document.getElementById('reviews-summary');
    if (!tbody) return;

    const filtered = applyFilters(allReviews);
    const sorted = sortItems(filtered, sortField, sortDir);
    const page = paginate(sorted, currentPage, pageSize);

    if (!page.items.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-5">نظری یافت نشد.</td></tr>';
    } else {
      tbody.innerHTML = page.items.map((review) => `
        <tr data-id="${review.id}">
          <td><input type="checkbox" class="form-check-input row-select" value="${review.id}"
                     ${selectedIds.has(review.id) ? 'checked' : ''} aria-label="انتخاب"></td>
          <td><a href="#" class="view-review" data-id="${review.id}">${escapeHtml(getProductName(review.productId))}</a></td>
          <td>${escapeHtml(getCustomerName(review.customerId))}</td>
          <td>${renderStars(review.rating)}</td>
          <td>${escapeHtml(review.title || '—')}</td>
          <td>${getStatusBadge(review.status)}</td>
          <td class="text-muted small">${escapeHtml(formatDateTime(review.createdAt))}</td>
          <td class="no-print">
            <div class="table-actions">
              <button type="button" class="btn btn-outline-primary view-review" data-id="${review.id}" title="مشاهده">
                <i class="bi bi-eye"></i>
              </button>
              ${review.status !== 'approved' ? `<button type="button" class="btn btn-outline-success approve-one" data-id="${review.id}" title="تأیید"><i class="bi bi-check-lg"></i></button>` : ''}
              ${review.status !== 'rejected' ? `<button type="button" class="btn btn-outline-danger reject-one" data-id="${review.id}" title="رد"><i class="bi bi-x-lg"></i></button>` : ''}
              <button type="button" class="btn btn-outline-danger delete-one" data-id="${review.id}" title="حذف"><i class="bi bi-trash"></i></button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    if (summaryEl) {
      summaryEl.textContent = `نمایش ${page.items.length.toLocaleString('fa-IR')} از ${page.totalItems.toLocaleString('fa-IR')} نظر`;
    }

    ShopAdmin.ui.renderPagination(
      document.getElementById('reviews-pagination'),
      page.page,
      page.totalPages,
      (p) => { currentPage = p; renderTable(); }
    );

    const selectAll = document.getElementById('select-all');
    if (selectAll) {
      selectAll.checked = page.items.length > 0 && page.items.every((r) => selectedIds.has(r.id));
      selectAll.indeterminate = page.items.some((r) => selectedIds.has(r.id))
        && !page.items.every((r) => selectedIds.has(r.id));
    }

    updateBulkButtons();
  };

  const refreshData = () => {
    const data = ShopAdmin.storage.getData();
    allReviews = data.reviews || [];
    products = data.products || [];
    customers = data.customers || [];
    adminProfile = data.adminProfile || {};
    renderTable();
  };

  const approveReviews = (ids) => {
    const now = new Date().toISOString();
    const reviewer = getReviewerName();
    const productIds = new Set();

    ids.forEach((id) => {
      const review = reviewRepo.getById(id);
      if (!review) return;
      reviewRepo.update(id, {
        status: 'approved',
        reviewedAt: now,
        reviewerName: reviewer,
        rejectReason: null
      });
      productIds.add(review.productId);
    });

    productIds.forEach((pid) => recalculateProductRating(pid));
    selectedIds.clear();
    refreshData();
    ShopAdmin.ui.showToast('success', `${ids.length.toLocaleString('fa-IR')} نظر تأیید شد.`);
  };

  const rejectReviews = (ids, rejectReason, adminNote) => {
    const now = new Date().toISOString();
    const reviewer = getReviewerName();
    const productIds = new Set();

    ids.forEach((id) => {
      const review = reviewRepo.getById(id);
      if (!review) return;
      reviewRepo.update(id, {
        status: 'rejected',
        rejectReason,
        adminNote: adminNote || review.adminNote || null,
        reviewedAt: now,
        reviewerName: reviewer
      });
      productIds.add(review.productId);
    });

    productIds.forEach((pid) => recalculateProductRating(pid));
    selectedIds.clear();
    refreshData();
    ShopAdmin.ui.showToast('success', `${ids.length.toLocaleString('fa-IR')} نظر رد شد.`);
  };

  const deleteReviews = (ids) => {
    const productIds = new Set();

    ids.forEach((id) => {
      const review = reviewRepo.getById(id);
      if (review) productIds.add(review.productId);
      reviewRepo.remove(id);
    });

    productIds.forEach((pid) => recalculateProductRating(pid));
    selectedIds.clear();
    refreshData();
    ShopAdmin.ui.showToast('success', 'نظر(ها) حذف شد.');
  };

  const showReviewDetail = (id) => {
    const review = reviewRepo.getById(id);
    if (!review) return;

    currentReviewId = id;
    const body = document.getElementById('review-detail-body');
    const title = document.getElementById('reviewDetailTitle');

    if (title) title.textContent = review.title || 'جزئیات نظر';
    if (body) {
      body.innerHTML = `
        <div class="row g-3">
          <div class="col-md-6">
            <strong class="text-muted d-block small">محصول</strong>
            <span>${escapeHtml(getProductName(review.productId))}</span>
          </div>
          <div class="col-md-6">
            <strong class="text-muted d-block small">مشتری</strong>
            <span>${escapeHtml(getCustomerName(review.customerId))}</span>
          </div>
          <div class="col-md-6">
            <strong class="text-muted d-block small">امتیاز</strong>
            ${renderStars(review.rating)}
          </div>
          <div class="col-md-6">
            <strong class="text-muted d-block small">وضعیت</strong>
            ${getStatusBadge(review.status)}
          </div>
          <div class="col-12">
            <strong class="text-muted d-block small">عنوان</strong>
            <span>${escapeHtml(review.title || '—')}</span>
          </div>
          <div class="col-12">
            <strong class="text-muted d-block small">متن نظر</strong>
            <p class="mb-0">${escapeHtml(review.body || '—')}</p>
          </div>
          <div class="col-md-6">
            <strong class="text-muted d-block small">تاریخ ثبت</strong>
            <span>${escapeHtml(formatDateTime(review.createdAt))}</span>
          </div>
          <div class="col-md-6">
            <strong class="text-muted d-block small">تاریخ بررسی</strong>
            <span>${escapeHtml(formatDateTime(review.reviewedAt))}</span>
          </div>
          <div class="col-md-6">
            <strong class="text-muted d-block small">بررسی‌کننده</strong>
            <span>${escapeHtml(review.reviewerName || '—')}</span>
          </div>
          ${review.rejectReason ? `
            <div class="col-12">
              <strong class="text-muted d-block small">دلیل رد</strong>
              <span class="text-danger">${escapeHtml(review.rejectReason)}</span>
            </div>` : ''}
          ${review.adminNote ? `
            <div class="col-12">
              <strong class="text-muted d-block small">یادداشت مدیر</strong>
              <span>${escapeHtml(review.adminNote)}</span>
            </div>` : ''}
        </div>
      `;
    }

    const modal = document.getElementById('review-detail-modal');
    ShopAdmin.ui.showModal(modal);
  };

  const openRejectModal = (ids) => {
    pendingRejectIds = ids;
    document.getElementById('reject-reason').value = '';
    document.getElementById('admin-note').value = '';
    ShopAdmin.ui.showModal(document.getElementById('reject-reason-modal'));
  };

  const populateSelects = () => {
    const productSel = document.getElementById('filter-product');
    const customerSel = document.getElementById('filter-customer');

    if (productSel) {
      productSel.innerHTML = '<option value="">همه محصولات</option>'
        + products.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    }
    if (customerSel) {
      customerSel.innerHTML = '<option value="">همه مشتریان</option>'
        + customers.map((c) => `<option value="${c.id}">${escapeHtml(`${c.firstName} ${c.lastName}`)}</option>`).join('');
    }
  };

  const bindEvents = () => {
    const debouncedSearch = debounce((value) => {
      filters.search = value;
      currentPage = 1;
      renderTable();
    }, 300);

    document.getElementById('filter-search')?.addEventListener('input', (e) => debouncedSearch(e.target.value));

    ['filter-status', 'filter-rating', 'filter-product', 'filter-customer'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', (e) => {
        const key = id.replace('filter-', '').replace('date-from', 'dateFrom').replace('date-to', 'dateTo');
        const map = {
          status: 'status', rating: 'rating', product: 'productId', customer: 'customerId'
        };
        filters[map[key] || key] = e.target.value;
        currentPage = 1;
        renderTable();
      });
    });

    document.getElementById('filter-date-from')?.addEventListener('change', (e) => {
      filters.dateFrom = e.target.value;
      currentPage = 1;
      renderTable();
    });

    document.getElementById('filter-date-to')?.addEventListener('change', (e) => {
      filters.dateTo = e.target.value;
      currentPage = 1;
      renderTable();
    });

    document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
      filters = { search: '', status: '', rating: '', productId: '', customerId: '', dateFrom: '', dateTo: '' };
      document.getElementById('filter-search').value = '';
      document.getElementById('filter-status').value = '';
      document.getElementById('filter-rating').value = '';
      document.getElementById('filter-product').value = '';
      document.getElementById('filter-customer').value = '';
      if (window.PersianDatePicker) {
        window.PersianDatePicker.setValue('filter-date-from', '', false);
        window.PersianDatePicker.setValue('filter-date-to', '', false);
      } else {
        document.getElementById('filter-date-from').value = '';
        document.getElementById('filter-date-to').value = '';
      }
      currentPage = 1;
      renderTable();
    });

    document.getElementById('select-all')?.addEventListener('change', (e) => {
      const filtered = applyFilters(allReviews);
      const sorted = sortItems(filtered, sortField, sortDir);
      const page = paginate(sorted, currentPage, pageSize);
      if (e.target.checked) {
        page.items.forEach((r) => selectedIds.add(r.id));
      } else {
        page.items.forEach((r) => selectedIds.delete(r.id));
      }
      renderTable();
    });

    document.getElementById('reviews-body')?.addEventListener('change', (e) => {
      if (e.target.classList.contains('row-select')) {
        const id = Number(e.target.value);
        if (e.target.checked) selectedIds.add(id);
        else selectedIds.delete(id);
        updateBulkButtons();
      }
    });

    document.getElementById('reviews-body')?.addEventListener('click', (e) => {
      const viewBtn = e.target.closest('.view-review');
      if (viewBtn) {
        e.preventDefault();
        showReviewDetail(Number(viewBtn.dataset.id));
        return;
      }
      const approveBtn = e.target.closest('.approve-one');
      if (approveBtn) {
        approveReviews([Number(approveBtn.dataset.id)]);
        return;
      }
      const rejectBtn = e.target.closest('.reject-one');
      if (rejectBtn) {
        openRejectModal([Number(rejectBtn.dataset.id)]);
        return;
      }
      const deleteBtn = e.target.closest('.delete-one');
      if (deleteBtn) {
        ShopAdmin.ui.showConfirmModal('حذف نظر', 'آیا از حذف این نظر مطمئن هستید؟', () => {
          deleteReviews([Number(deleteBtn.dataset.id)]);
        });
      }
    });

    document.getElementById('btn-bulk-approve')?.addEventListener('click', () => {
      if (!selectedIds.size) return;
      ShopAdmin.ui.showConfirmModal(
        'تأیید گروهی',
        `آیا ${selectedIds.size.toLocaleString('fa-IR')} نظر انتخاب‌شده تأیید شود؟`,
        () => approveReviews([...selectedIds])
      );
    });

    document.getElementById('btn-bulk-reject')?.addEventListener('click', () => {
      if (!selectedIds.size) return;
      openRejectModal([...selectedIds]);
    });

    document.getElementById('confirm-reject-btn')?.addEventListener('click', () => {
      const reason = document.getElementById('reject-reason').value.trim();
      if (!reason) {
        ShopAdmin.ui.showToast('error', 'دلیل رد الزامی است.');
        return;
      }
      const note = document.getElementById('admin-note').value.trim();
      rejectReviews(pendingRejectIds, reason, note);
      ShopAdmin.ui.hideModal(document.getElementById('reject-reason-modal'));
      ShopAdmin.ui.hideModal(document.getElementById('review-detail-modal'));
    });

    document.getElementById('modal-approve-btn')?.addEventListener('click', () => {
      if (currentReviewId) approveReviews([currentReviewId]);
      ShopAdmin.ui.hideModal(document.getElementById('review-detail-modal'));
    });

    document.getElementById('modal-reject-btn')?.addEventListener('click', () => {
      if (currentReviewId) openRejectModal([currentReviewId]);
    });

    document.getElementById('modal-delete-btn')?.addEventListener('click', () => {
      if (!currentReviewId) return;
      ShopAdmin.ui.showConfirmModal('حذف نظر', 'آیا از حذف این نظر مطمئن هستید؟', () => {
        deleteReviews([currentReviewId]);
        ShopAdmin.ui.hideModal(document.getElementById('review-detail-modal'));
      });
    });

    ShopAdmin.ui.bindTableSort(document.getElementById('reviews-table'), (field, dir) => {
      sortField = field;
      sortDir = dir;
      renderTable();
    });
  };

  const initReviews = () => {
    if (!ShopAdmin.auth.requireAuth()) return;

    ShopAdmin.ui.initBreadcrumb([
      { label: 'داشبورد', href: 'index.html' },
      { label: 'نظرات و امتیازها' }
    ]);

    const data = ShopAdmin.storage.getData();
    allReviews = data.reviews || [];
    products = data.products || [];
    customers = data.customers || [];
    adminProfile = data.adminProfile || {};

    populateSelects();
    bindEvents();
    renderTable();
  };

  document.addEventListener('DOMContentLoaded', initReviews);
})(window.ShopAdmin = window.ShopAdmin || {});
