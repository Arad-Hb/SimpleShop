/**
 * ui.js — سایدبار، breadcrumb، pagination، toast، modal، custom select
 * هم‌تراز با الگوهای AdminPanel
 */
(function (ShopCustomer) {
  'use strict';

  const { escapeHtml } = ShopCustomer.utils;

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'داشبورد', icon: 'bi-speedometer2', href: 'index.html' },
    { id: 'orders', label: 'سفارش‌های من', icon: 'bi-bag-check', href: 'orders.html' },
    { id: 'carts', label: 'سبدهای ناتمام', icon: 'bi-cart3', href: 'carts.html' },
    { id: 'profile', label: 'پروفایل من', icon: 'bi-person', href: 'profile.html' },
    { id: 'financial', label: 'اطلاعات مالی', icon: 'bi-wallet2', href: 'financial.html' }
  ];

  // ─── Overlay manager ─────────────────────────────────────────
  const overlayClosers = new Map();

  const registerOverlay = (id, closeFn) => {
    if (!id || typeof closeFn !== 'function') return () => {};
    overlayClosers.set(id, closeFn);
    return () => {
      if (overlayClosers.get(id) === closeFn) overlayClosers.delete(id);
    };
  };

  const closeAllOverlays = (exceptId = null) => {
    overlayClosers.forEach((closeFn, id) => {
      if (exceptId != null && id === exceptId) return;
      try { closeFn(); } catch (_) { /* ignore */ }
    });
  };

  const notifyOverlayOpen = (id) => closeAllOverlays(id);

  const OVERLAY_ANIM_MS = 220;
  const PAGE_TRANSIT_MS = 340;
  const PAGE_LEAVE_MS = 180;
  const prefersReducedMotion = () =>
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animateOverlayOpen = (el, openClass = 'is-open') => {
    if (!el) return;
    el.hidden = false;
    el.classList.remove('is-leaving');
    if (prefersReducedMotion()) {
      el.classList.add(openClass);
      return;
    }
    el.classList.remove(openClass);
    void el.offsetWidth;
    requestAnimationFrame(() => el.classList.add(openClass));
  };

  const animateOverlayClose = (el, { openClass = 'is-open', onDone } = {}) => {
    if (!el) {
      if (typeof onDone === 'function') onDone();
      return 0;
    }
    const finish = () => {
      el.classList.remove(openClass, 'is-leaving');
      el.hidden = true;
      if (typeof onDone === 'function') onDone();
    };
    if (prefersReducedMotion() || el.hidden) {
      finish();
      return 0;
    }
    el.classList.remove(openClass);
    el.classList.add('is-leaving');
    return window.setTimeout(finish, OVERLAY_ANIM_MS);
  };

  const pulsePageContent = (fromEl) => {
    const target =
      (fromEl && fromEl.closest('.content-card, .card, [data-page-content], .admin-content')) ||
      document.querySelector('.admin-content');
    if (!target || prefersReducedMotion()) return;
    target.classList.remove('is-page-transient');
    void target.offsetWidth;
    target.classList.add('is-page-transient');
    window.setTimeout(() => target.classList.remove('is-page-transient'), PAGE_TRANSIT_MS);
  };

  const bindTransientNavLinks = (root) => {
    if (!root) return;
    root.querySelectorAll('a[href]').forEach((a) => {
      if (a.dataset.transientBound === '1') return;
      a.dataset.transientBound = '1';
      a.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
        if (prefersReducedMotion()) return;
        const content = document.querySelector('.admin-content');
        if (!content) return;
        e.preventDefault();
        content.classList.add('is-page-leaving');
        window.setTimeout(() => {
          window.location.href = href;
        }, PAGE_LEAVE_MS);
      });
    });
  };

  // ─── Sidebar ─────────────────────────────────────────────────

  const initSidebar = (activePage) => {
    const sidebar = document.querySelector('#sidebar, [data-sidebar]');
    if (!sidebar) return;

    const nav = sidebar.querySelector('.sidebar-nav') || sidebar;
    if (!nav.querySelector('[data-nav-built]')) {
      nav.innerHTML = NAV_ITEMS.map((item) => `
        <a href="${escapeHtml(item.href)}"
           class="nav-link sidebar-link ${item.id === activePage ? 'active' : ''}"
           data-page="${escapeHtml(item.id)}"
           title="${escapeHtml(item.label)}">
          <i class="bi ${escapeHtml(item.icon)}" aria-hidden="true"></i>
          <span>${escapeHtml(item.label)}</span>
        </a>
      `).join('');
      nav.setAttribute('data-nav-built', 'true');
    } else {
      nav.querySelectorAll('[data-page]').forEach((link) => {
        link.classList.toggle('active', link.dataset.page === activePage);
      });
    }

    const brand = sidebar.querySelector('.sidebar-brand');
    if (brand && !brand.querySelector('[data-sidebar-collapse]')) {
      const collapseBtn = document.createElement('button');
      collapseBtn.type = 'button';
      collapseBtn.className = 'sidebar-collapse-btn';
      collapseBtn.setAttribute('data-sidebar-collapse', '');
      collapseBtn.setAttribute('aria-label', 'جمع/باز کردن منو');
      collapseBtn.setAttribute('title', 'جمع/باز کردن منو');
      collapseBtn.innerHTML = '<i class="bi bi-layout-sidebar-reverse" aria-hidden="true"></i>';
      brand.insertBefore(collapseBtn, brand.firstChild);
    }

    // Keep avatar visible when collapse button is injected into customer brand
    const avatar = brand?.querySelector('.customer-avatar-wrap');
    if (avatar && brand?.firstElementChild?.hasAttribute?.('data-sidebar-collapse')) {
      brand.insertBefore(avatar, brand.children[1] || null);
    }

    const SIDEBAR_KEY = 'shopCustomerSidebarCollapsed';
    const applyCollapsed = (collapsed) => {
      document.body.classList.toggle('sidebar-collapsed', collapsed);
      try {
        localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
      } catch { /* ignore */ }
    };

    if (localStorage.getItem(SIDEBAR_KEY) === '1' && window.matchMedia('(min-width: 992px)').matches) {
      document.body.classList.add('sidebar-collapsed');
    }

    const toggleCollapsed = () => {
      if (window.matchMedia('(max-width: 991.98px)').matches) {
        document.body.classList.toggle('sidebar-open');
        return;
      }
      applyCollapsed(!document.body.classList.contains('sidebar-collapsed'));
    };

    sidebar.querySelectorAll('[data-sidebar-collapse]').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleCollapsed();
      });
      btn.dataset.bound = 'true';
    });

    const toggleBtn = document.querySelector('[data-sidebar-toggle]');
    if (toggleBtn) {
      toggleBtn.classList.remove('d-lg-none');
      toggleBtn.classList.add('sidebar-toggle-btn');
      toggleBtn.setAttribute('aria-label', 'جمع/باز کردن منو');
      toggleBtn.setAttribute('title', 'جمع/باز کردن منو');
      toggleBtn.innerHTML = '<i class="bi bi-layout-sidebar-reverse" aria-hidden="true"></i>';
      if (!toggleBtn.dataset.bound) {
        toggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          toggleCollapsed();
        });
        toggleBtn.dataset.bound = 'true';
      }
    }

    document.addEventListener('click', (e) => {
      if (
        document.body.classList.contains('sidebar-open') &&
        !e.target.closest('.admin-sidebar') &&
        !e.target.closest('[data-sidebar-toggle]') &&
        !e.target.closest('[data-sidebar-collapse]')
      ) {
        document.body.classList.remove('sidebar-open');
      }
    });
  };

  // ─── Breadcrumb (chevron ribbon) ─────────────────────────────

  const initBreadcrumb = (items = []) => {
    const el = document.querySelector('#breadcrumb, .breadcrumb, [data-breadcrumb]');
    if (!el || !items.length) return;

    el.classList.add('chevron-breadcrumb');
    el.setAttribute('aria-label', 'مسیر صفحه');

    el.innerHTML = items.map((item, i) => {
      const isLast = i === items.length - 1;
      const isFirst = i === 0;
      const href = item.href || '';
      const isHome = isFirst && (
        href === 'index.html' ||
        href === './index.html' ||
        href.endsWith('/index.html') ||
        item.label === 'داشبورد' ||
        item.label === 'خانه'
      );

      const classes = [
        'chevron-breadcrumb__item',
        isHome ? 'is-home' : '',
        isLast ? 'is-active' : ''
      ].filter(Boolean).join(' ');

      let inner = '';
      if (isHome && !isLast) {
        inner = `<i class="bi bi-house-door-fill" aria-hidden="true"></i><span class="visually-hidden">${escapeHtml(item.label)}</span>`;
      } else if (isHome && isLast) {
        inner = `<i class="bi bi-house-door-fill" aria-hidden="true"></i><span>${escapeHtml(item.label)}</span>`;
      } else {
        inner = `<span>${escapeHtml(item.label)}</span>`;
      }

      if (isLast || !href) {
        return `<li class="${classes}" aria-current="page"><span class="chevron-breadcrumb__link">${inner}</span></li>`;
      }
      return `<li class="${classes}"><a class="chevron-breadcrumb__link" href="${escapeHtml(href)}">${inner}</a></li>`;
    }).join('');

    bindTransientNavLinks(el);
  };

  // ─── Toast ───────────────────────────────────────────────────

  let toastContainer = null;

  const ensureToast = () => {
    if (toastContainer) return toastContainer;
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
    return toastContainer;
  };

  const showToast = (type = 'info', message = '') => {
    const icons = {
      success: 'bi-check-circle-fill text-success',
      error: 'bi-x-circle-fill text-danger',
      warning: 'bi-exclamation-triangle-fill text-warning',
      info: 'bi-info-circle-fill text-info'
    };
    const wrap = ensureToast();
    const el = document.createElement('div');
    el.className = 'toast show align-items-center border-0 shadow';
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icons[type] || icons.info}"></i>
          <span>${escapeHtml(message)}</span>
        </div>
        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="بستن"></button>
      </div>`;
    wrap.appendChild(el);
    const close = () => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    };
    el.querySelector('.btn-close')?.addEventListener('click', close);
    setTimeout(close, 4000);
  };

  // ─── Confirm modal ───────────────────────────────────────────

  let confirmModalEl = null;

  const enhanceAdminModal = (modalEl) => {
    if (!modalEl) return modalEl;
    modalEl.classList.add('admin-modal');
    modalEl.querySelector('.modal-dialog')?.classList.add('modal-dialog-centered');
    modalEl.querySelector('.modal-content')?.classList.add('admin-modal__content');
    modalEl.querySelectorAll('.modal-header .btn-close, .modal-header .modal-close').forEach((btn) => {
      btn.classList.add('modal-close');
      btn.classList.remove('btn-close');
      btn.type = 'button';
      btn.setAttribute('aria-label', btn.getAttribute('aria-label') || 'بستن');
      if (!btn.querySelector('i.bi-x-lg')) {
        btn.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
      }
      const header = btn.closest('.modal-header');
      if (header && header.firstElementChild !== btn) {
        header.insertBefore(btn, header.firstElementChild);
      }
    });
    return modalEl;
  };

  const ensureConfirmModal = () => {
    if (confirmModalEl) return confirmModalEl;
    confirmModalEl = document.createElement('div');
    confirmModalEl.className = 'modal fade admin-modal';
    confirmModalEl.id = 'shopCustomerConfirmModal';
    confirmModalEl.tabIndex = -1;
    confirmModalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content admin-modal__content">
          <div class="modal-header">
            <button type="button" class="modal-close" data-bs-dismiss="modal" aria-label="بستن">
              <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>
            <h5 class="modal-title" data-confirm-title></h5>
          </div>
          <div class="modal-body">
            <p class="admin-modal__message mb-0" data-confirm-message></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary modal-btn" data-bs-dismiss="modal">انصراف</button>
            <button type="button" class="btn btn-danger modal-btn" data-confirm-btn>تأیید</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(confirmModalEl);
    enhanceAdminModal(confirmModalEl);
    return confirmModalEl;
  };

  const showModal = (modalEl) => {
    if (!modalEl) return;
    enhanceAdminModal(modalEl);
    closeAllOverlays();
    if (window.bootstrap?.Modal) {
      window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
    } else {
      modalEl.classList.add('show');
      modalEl.style.display = 'block';
    }
  };

  const hideModal = (modalEl) => {
    if (!modalEl) return;
    if (window.bootstrap?.Modal) {
      window.bootstrap.Modal.getInstance(modalEl)?.hide();
    } else {
      modalEl.classList.remove('show');
      modalEl.style.display = 'none';
    }
  };

  const showConfirmModal = (title, message, onConfirm) => {
    const modal = ensureConfirmModal();
    modal.querySelector('[data-confirm-title]').textContent = title;
    modal.querySelector('[data-confirm-message]').textContent = message;
    const confirmBtn = modal.querySelector('[data-confirm-btn]');
    const fresh = confirmBtn.cloneNode(true);
    confirmBtn.replaceWith(fresh);
    fresh.addEventListener('click', () => {
      if (typeof onConfirm === 'function') onConfirm();
      hideModal(modal);
    });
    showModal(modal);
  };

  // ─── Pagination (chevron ribbon) ─────────────────────────────

  const renderPagination = (container, page, totalPages, onPageChange) => {
    if (!container) return;
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    container.innerHTML = `
      <nav class="chevron-pagination" aria-label="صفحه‌بندی">
        <ul class="chevron-pagination__list">
          <li class="chevron-pagination__item is-nav is-prev ${page <= 1 ? 'is-disabled' : ''}">
            <button type="button" class="chevron-pagination__btn" data-page="${page - 1}" aria-label="قبلی" ${page <= 1 ? 'disabled' : ''}>
              <i class="bi bi-chevron-left" aria-hidden="true"></i>
            </button>
          </li>
          ${pages.map((p) => {
            if (p === '...') {
              return `<li class="chevron-pagination__item is-ellipsis" aria-hidden="true"><span class="chevron-pagination__btn">…</span></li>`;
            }
            return `
              <li class="chevron-pagination__item ${p === page ? 'is-active' : ''}">
                <button type="button" class="chevron-pagination__btn" data-page="${p}" ${p === page ? 'aria-current="page"' : ''}>
                  ${p.toLocaleString('fa-IR')}
                </button>
              </li>`;
          }).join('')}
          <li class="chevron-pagination__item is-nav is-next ${page >= totalPages ? 'is-disabled' : ''}">
            <button type="button" class="chevron-pagination__btn" data-page="${page + 1}" aria-label="بعدی" ${page >= totalPages ? 'disabled' : ''}>
              <i class="bi bi-chevron-right" aria-hidden="true"></i>
            </button>
          </li>
        </ul>
      </nav>`;

    container.querySelectorAll('[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = Number(btn.dataset.page);
        if (target >= 1 && target <= totalPages && target !== page && typeof onPageChange === 'function') {
          pulsePageContent(container);
          onPageChange(target);
        }
      });
    });
  };

  const paginate = (items, page = 1, pageSize = 10) => {
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      page: safePage,
      pageSize,
      totalItems,
      totalPages
    };
  };

  // ─── Custom select ───────────────────────────────────────────

  const placeOverlayMenu = (menu, anchorEl) => {
    if (!menu || !anchorEl) return;
    const margin = 8;
    const rect = anchorEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(Math.max(rect.width, 160), vw - margin * 2);
    menu.style.position = 'fixed';
    menu.style.width = `${width}px`;
    menu.style.zIndex = '1100';
    let left = document.documentElement.dir === 'rtl' ? rect.right - width : rect.left;
    left = Math.min(Math.max(left, margin), vw - width - margin);
    menu.style.left = `${left}px`;
    menu.style.top = `${rect.bottom + 6}px`;
    const panelRect = menu.getBoundingClientRect();
    if (panelRect.bottom > vh - margin) {
      menu.style.top = `${Math.max(margin, rect.top - panelRect.height - 6)}px`;
    }
  };

  const enhanceFormSelect = (select) => {
    if (!select || select.dataset.customSelect === '1' || select.dataset.nativeSelect != null) return;
    select.dataset.customSelect = '1';

    const wrap = document.createElement('div');
    wrap.className = 'custom-select';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('custom-select__native');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select__trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    if (select.id) trigger.id = `${select.id}-trigger`;
    if (select.disabled) trigger.disabled = true;

    const label = document.createElement('span');
    label.className = 'custom-select__label';
    trigger.appendChild(label);

    const caret = document.createElement('i');
    caret.className = 'bi bi-chevron-down custom-select__caret';
    caret.setAttribute('aria-hidden', 'true');
    trigger.appendChild(caret);

    const menu = document.createElement('div');
    menu.className = 'custom-select__menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;

    wrap.appendChild(trigger);

    let placeCleanup = null;
    let closeTimer = null;
    const clearPlace = () => {
      if (placeCleanup) {
        placeCleanup();
        placeCleanup = null;
      }
    };

    const syncLabel = () => {
      const opt = select.options[select.selectedIndex];
      label.textContent = opt ? opt.textContent : 'انتخاب کنید';
      label.classList.toggle('is-placeholder', !opt || opt.value === '');
    };

    const buildItems = () => {
      menu.innerHTML = '';
      Array.from(select.options).forEach((opt) => {
        if (opt.hidden) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'custom-select__option';
        btn.setAttribute('role', 'option');
        btn.dataset.value = opt.value;
        btn.textContent = opt.textContent;
        if (opt.disabled) {
          btn.disabled = true;
          btn.classList.add('is-disabled');
        }
        if (opt.selected) {
          btn.classList.add('is-selected');
          btn.setAttribute('aria-selected', 'true');
        }
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (opt.disabled) return;
          select.value = opt.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          syncLabel();
          setOpen(false);
        });
        menu.appendChild(btn);
      });
    };

    const overlayId = `custom-select-${select.id || Math.random().toString(36).slice(2)}`;
    const isMenuOpen = () => wrap.classList.contains('is-open') && menu.classList.contains('is-open');

    const setOpen = (open) => {
      const willOpen = Boolean(open);
      if (willOpen === isMenuOpen() && !menu.classList.contains('is-leaving')) return;
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }

      if (willOpen) {
        notifyOverlayOpen(overlayId);
        wrap.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        buildItems();
        document.body.appendChild(menu);
        menu.hidden = false;
        placeOverlayMenu(menu, trigger);
        animateOverlayOpen(menu, 'is-open');
        clearPlace();
        const onMove = () => placeOverlayMenu(menu, trigger);
        window.addEventListener('resize', onMove);
        window.addEventListener('scroll', onMove, true);
        placeCleanup = () => {
          window.removeEventListener('resize', onMove);
          window.removeEventListener('scroll', onMove, true);
        };
      } else {
        wrap.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        clearPlace();
        closeTimer = animateOverlayClose(menu, {
          openClass: 'is-open',
          onDone: () => {
            if (menu.parentElement === document.body) wrap.appendChild(menu);
            closeTimer = null;
          }
        });
      }
    };

    registerOverlay(overlayId, () => setOpen(false));

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!select.disabled) setOpen(!isMenuOpen());
    });

    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target) && !menu.contains(e.target)) setOpen(false);
    });

    if (select.id) {
      document.querySelectorAll(`label[for="${select.id}"]`).forEach((lab) => {
        lab.setAttribute('for', trigger.id);
      });
    }

    select.addEventListener('change', syncLabel);
    syncLabel();
  };

  const enhanceFormSelects = (scope = document) => {
    scope.querySelectorAll('select.form-select:not([data-custom-select="1"]):not([data-native-select])')
      .forEach(enhanceFormSelect);
  };

  ShopCustomer.ui = {
    NAV_ITEMS,
    initSidebar,
    initBreadcrumb,
    showToast,
    showConfirmModal,
    enhanceAdminModal,
    showModal,
    hideModal,
    renderPagination,
    paginate,
    enhanceFormSelect,
    enhanceFormSelects,
    registerOverlay,
    closeAllOverlays,
    notifyOverlayOpen
  };
})(window.ShopCustomer = window.ShopCustomer || {});
