/**
 * ui.js — اجزای رابط کاربری مشترک
 */
(function (ShopAdmin) {
  'use strict';

  const { escapeHtml } = ShopAdmin.utils || { escapeHtml: (s) => String(s) };

  // ─── Overlay manager: only one dropdown/menu open at a time ───
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
      try {
        closeFn();
      } catch (_) { /* ignore */ }
    });
  };

  /** Call before opening any overlay so siblings close first. */
  const notifyOverlayOpen = (id) => {
    closeAllOverlays(id);
  };

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

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'داشبورد', icon: 'bi-speedometer2', href: 'index.html' },
    { id: 'categories', label: 'دسته‌بندی‌ها', icon: 'bi-tags', href: 'categories.html' },
    { id: 'suppliers', label: 'تأمین‌کنندگان', icon: 'bi-truck', href: 'suppliers.html' },
    { id: 'products', label: 'محصولات', icon: 'bi-box-seam', href: 'products.html' },
    { id: 'product-gallery', label: 'گالری محصولات', icon: 'bi-images', href: 'product-gallery.html' },
    { id: 'customers', label: 'مشتریان', icon: 'bi-people', href: 'customers.html' },
    { id: 'carts', label: 'سبدهای خرید', icon: 'bi-basket', href: 'carts.html' },
    { id: 'orders', label: 'سفارش‌ها', icon: 'bi-cart-check', href: 'orders.html' },
    { id: 'reviews', label: 'نظرات و امتیازها', icon: 'bi-chat-square-text', href: 'reviews.html' },
    { id: 'reports', label: 'گزارش‌ها', icon: 'bi-bar-chart-line', href: 'reports.html' },
    { id: 'settings', label: 'سازمان فروش', icon: 'bi-building-gear', href: 'settings.html' },
    { id: 'profile', label: 'پروفایل مدیر', icon: 'bi-person-circle', href: 'profile.html' }
  ];

  const ensureAdminSidebarBrand = (brand) => {
    if (window.SimpleShopSidebarBrand?.ensure) {
      window.SimpleShopSidebarBrand.ensure(brand, { escapeHtml });
    }
  };

  const initSidebar = (activePage) => {
    const sidebar = document.querySelector('#sidebar, .sidebar, [data-sidebar]');
    if (!sidebar) return;

    const nav = sidebar.querySelector('nav, .sidebar-nav, ul') || sidebar;
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
    ensureAdminSidebarBrand(brand);
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

    const SIDEBAR_KEY = 'shopAdminSidebarCollapsed';
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
      if (document.body.classList.contains('sidebar-open') &&
          !e.target.closest('.admin-sidebar') &&
          !e.target.closest('[data-sidebar-toggle]') &&
          !e.target.closest('[data-sidebar-collapse]')) {
        document.body.classList.remove('sidebar-open');
      }
    });
  };

  // ─── Breadcrumb ──────────────────────────────────────────────

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
        item.label === 'داشبورد'
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

  const ensureToastContainer = () => {
    if (toastContainer) return toastContainer;
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
    return toastContainer;
  };

  const TOAST_ICONS = {
    success: 'bi-check-circle-fill text-success',
    error: 'bi-x-circle-fill text-danger',
    warning: 'bi-exclamation-triangle-fill text-warning',
    info: 'bi-info-circle-fill text-info'
  };

  const showToast = (type = 'info', message = '') => {
    const container = ensureToastContainer();
    const id = `toast-${Date.now()}`;
    const icon = TOAST_ICONS[type] || TOAST_ICONS.info;

    const toastEl = document.createElement('div');
    toastEl.id = id;
    toastEl.className = 'toast align-items-center border-0 show';
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icon}"></i>
          <span>${escapeHtml(message)}</span>
        </div>
        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="بستن"></button>
      </div>
    `;
    container.appendChild(toastEl);

    const close = () => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 300);
    };

    toastEl.querySelector('.btn-close')?.addEventListener('click', close);
    setTimeout(close, 4000);
  };

  // ─── Confirm Modal ───────────────────────────────────────────

  let confirmModalEl = null;

  const ensureConfirmModal = () => {
    if (confirmModalEl) return confirmModalEl;

    confirmModalEl = document.createElement('div');
    confirmModalEl.className = 'modal fade admin-modal';
    confirmModalEl.id = 'shopAdminConfirmModal';
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
      </div>
    `;
    document.body.appendChild(confirmModalEl);
    return confirmModalEl;
  };

  const showConfirmModal = (title, message, onConfirm) => {
    const modal = ensureConfirmModal();
    modal.querySelector('[data-confirm-title]').textContent = title;
    modal.querySelector('[data-confirm-message]').textContent = message;

    const confirmBtn = modal.querySelector('[data-confirm-btn]');
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.replaceWith(newBtn);
    newBtn.dataset.fullLabel = 'تأیید';
    newBtn.setAttribute('title', 'تأیید');

    newBtn.addEventListener('click', () => {
      if (typeof onConfirm === 'function') onConfirm();
      hideModal(modal);
    });

    showModal(modal);
  };

  // ─── Loading ─────────────────────────────────────────────────

  const showLoading = (el) => {
    if (!el) return;
    el.classList.add('position-relative');
    el.setAttribute('aria-busy', 'true');
    if (!el.querySelector('.shop-admin-loading')) {
      const overlay = document.createElement('div');
      overlay.className = 'shop-admin-loading position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75';
      overlay.style.zIndex = '10';
      overlay.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">در حال بارگذاری...</span></div>';
      el.appendChild(overlay);
    }
  };

  const hideLoading = (el) => {
    if (!el) return;
    el.removeAttribute('aria-busy');
    el.querySelector('.shop-admin-loading')?.remove();
  };

  // ─── Empty State ─────────────────────────────────────────────

  const renderEmptyState = (container, { icon = 'bi-inbox', title = 'موردی یافت نشد', message = '', actionLabel, onAction } = {}) => {
    if (!container) return;
    container.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi ${escapeHtml(icon)} display-4 d-block mb-3"></i>
        <h5>${escapeHtml(title)}</h5>
        ${message ? `<p class="mb-3">${escapeHtml(message)}</p>` : ''}
        ${actionLabel ? `<button type="button" class="btn btn-primary" data-empty-action>${escapeHtml(actionLabel)}</button>` : ''}
      </div>
    `;
    const btn = container.querySelector('[data-empty-action]');
    if (btn && typeof onAction === 'function') {
      btn.addEventListener('click', onAction);
    }
  };

  // ─── Searchable Dropdown (custom — Bootstrap nested menus break search) ───

  const renderSearchableDropdown = (container, options = [], value, onChange, settings = {}) => {
    if (!container) return;

    const sameValue = (a, b) => String(a ?? '') === String(b ?? '');
    const selected = options.find((o) => sameValue(o.value, value));
    const emptyLabel = settings.placeholder || 'انتخاب کنید...';
    const uid = `dd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    container.innerHTML = `
      <div class="searchable-dropdown w-100" data-dropdown-id="${uid}">
        <button type="button" class="btn btn-outline-secondary searchable-dropdown-toggle w-100"
                data-dd-toggle aria-expanded="false" aria-haspopup="listbox">
          <span data-dd-label class="${selected ? '' : 'is-placeholder'}">${escapeHtml(selected?.label ?? emptyLabel)}</span>
          <i class="bi bi-chevron-down" aria-hidden="true"></i>
        </button>
        <div class="searchable-dropdown-menu" data-dd-menu role="listbox">
          <div class="searchable-dropdown-search p-2 pb-1">
            <input type="search" class="form-control form-control-sm" placeholder="جستجو..."
                   data-dropdown-search autocomplete="off">
          </div>
          <div class="searchable-dropdown-items" data-dropdown-items></div>
        </div>
      </div>
    `;

    const root = container.querySelector('.searchable-dropdown');
    const menu = container.querySelector('[data-dd-menu]');
    const toggleBtn = container.querySelector('[data-dd-toggle]');
    const labelEl = container.querySelector('[data-dd-label]');
    const itemsEl = container.querySelector('[data-dropdown-items]');
    const searchEl = container.querySelector('[data-dropdown-search]');

    const placeMenu = () => {
      if (menu.hidden && !menu.classList.contains('show')) return;
      const margin = 8;
      const rect = toggleBtn.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Match trigger width; never exceed viewport
      const width = Math.min(Math.max(rect.width, 140), vw - margin * 2);
      let left = document.documentElement.dir === 'rtl' ? rect.right - width : rect.left;
      left = Math.min(Math.max(left, margin), vw - width - margin);

      menu.style.position = 'fixed';
      menu.style.zIndex = '1090';
      menu.style.width = `${width}px`;
      menu.style.maxWidth = `${width}px`;
      menu.style.left = `${left}px`;
      menu.style.right = 'auto';
      menu.style.top = `${rect.bottom + 4}px`;

      const menuRect = menu.getBoundingClientRect();
      if (menuRect.bottom > vh - margin) {
        const above = Math.max(margin, rect.top - menuRect.height - 4);
        menu.style.top = `${above}px`;
      }
    };

    let placeCleanup = null;
    let closeTimer = null;
    let menuHost = menu.parentElement;
    const clearPlace = () => {
      if (placeCleanup) {
        placeCleanup();
        placeCleanup = null;
      }
    };

    const isMenuOpen = () => root.classList.contains('is-open') && menu.classList.contains('show');

    const setOpen = (open) => {
      const willOpen = Boolean(open);
      if (willOpen === isMenuOpen() && !menu.classList.contains('is-leaving')) return;
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }

      if (willOpen) {
        notifyOverlayOpen(uid);
        root.classList.add('is-open');
        toggleBtn.setAttribute('aria-expanded', 'true');
        if (menu.parentElement !== document.body) {
          document.body.appendChild(menu);
        }
        searchEl.value = '';
        renderItems('');
        menu.hidden = false;
        animateOverlayOpen(menu, 'show');
        placeMenu();
        clearPlace();
        const onMove = () => placeMenu();
        window.addEventListener('resize', onMove);
        window.addEventListener('scroll', onMove, true);
        placeCleanup = () => {
          window.removeEventListener('resize', onMove);
          window.removeEventListener('scroll', onMove, true);
        };
        setTimeout(() => searchEl.focus(), 0);
      } else {
        root.classList.remove('is-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        clearPlace();
        closeTimer = animateOverlayClose(menu, {
          openClass: 'show',
          onDone: () => {
            menu.style.left = '';
            menu.style.top = '';
            menu.style.width = '';
            menu.style.maxWidth = '';
            if (menuHost && menu.parentElement !== menuHost) {
              menuHost.appendChild(menu);
            }
            closeTimer = null;
          }
        });
      }
    };

    registerOverlay(uid, () => setOpen(false));

    const renderItems = (filter = '') => {
      const q = filter.trim().toLowerCase();
      const filtered = q
        ? options.filter((o) => (o.label || '').toLowerCase().includes(q))
        : options;

      itemsEl.innerHTML = filtered.length
        ? filtered.map((o) => `
            <button type="button" class="searchable-dropdown-item ${sameValue(o.value, value) ? 'active' : ''}"
                    data-value="${escapeHtml(String(o.value))}" role="option">
              ${escapeHtml(o.label)}
            </button>
          `).join('')
        : '<div class="searchable-dropdown-item text-muted">نتیجه‌ای یافت نشد</div>';

      itemsEl.querySelectorAll('[data-value]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const raw = btn.dataset.value;
          const numVal = Number(raw);
          const finalVal = raw !== '' && !Number.isNaN(numVal) ? numVal : raw;
          setOpen(false);
          if (typeof onChange === 'function') onChange(finalVal);
        });
      });
    };

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(!isMenuOpen());
    });

    searchEl.addEventListener('click', (e) => e.stopPropagation());
    searchEl.addEventListener('keydown', (e) => e.stopPropagation());
    searchEl.addEventListener('input', (e) => renderItems(e.target.value));

    const onDocClick = (e) => {
      if (!root.contains(e.target) && !menu.contains(e.target)) setOpen(false);
    };
    if (container._ddDocClick) document.removeEventListener('click', container._ddDocClick);
    container._ddDocClick = onDocClick;
    document.addEventListener('click', onDocClick);

    renderItems();
    if (labelEl && selected) labelEl.textContent = selected.label;
  };

  // ─── Custom select (replaces native <select> popup — broken in DevTools responsive) ───

  const placeOverlayMenu = (menu, anchorEl) => {
    if (!menu || !anchorEl) return;
    const margin = 8;
    const rect = anchorEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(Math.max(rect.width, 120), vw - margin * 2);
    let left = document.documentElement.dir === 'rtl' ? rect.right - width : rect.left;
    left = Math.min(Math.max(left, margin), vw - width - margin);

    menu.style.position = 'fixed';
    menu.style.zIndex = '1100';
    menu.style.width = `${width}px`;
    menu.style.maxWidth = `${width}px`;
    menu.style.left = `${left}px`;
    menu.style.right = 'auto';
    menu.style.top = `${rect.bottom + 4}px`;

    const menuRect = menu.getBoundingClientRect();
    if (menuRect.bottom > vh - margin) {
      menu.style.top = `${Math.max(margin, rect.top - menuRect.height - 4)}px`;
    }
  };

  const enhanceFormSelect = (select) => {
    if (!select || select.dataset.customSelect === '1' || select.multiple) return null;
    if (select.closest('.custom-select')) return null;

    select.dataset.customSelect = '1';
    select.classList.add('custom-select__native');
    select.setAttribute('tabindex', '-1');
    select.setAttribute('aria-hidden', 'true');

    const wrap = document.createElement('div');
    wrap.className = 'custom-select';
    if (select.classList.contains('form-select-sm')) wrap.classList.add('custom-select--sm');
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);

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
    const menuHost = document.body;

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
          select.dispatchEvent(new Event('input', { bubbles: true }));
          syncLabel();
          setOpen(false);
        });
        menu.appendChild(btn);
      });
    };

    const overlayId = `custom-select-${select.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`}`;
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
        if (menu.parentElement !== menuHost) menuHost.appendChild(menu);
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
            if (menu.parentElement === menuHost) wrap.appendChild(menu);
            menu.style.left = '';
            menu.style.top = '';
            menu.style.width = '';
            closeTimer = null;
          }
        });
      }
    };

    registerOverlay(overlayId, () => setOpen(false));

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (select.disabled) return;
      setOpen(!isMenuOpen());
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
    });

    const onDocClick = (e) => {
      if (!wrap.contains(e.target) && !menu.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    // Point associated label at the visible trigger
    if (select.id) {
      document.querySelectorAll(`label[for="${select.id}"]`).forEach((lab) => {
        lab.setAttribute('for', trigger.id);
      });
    }

    select.addEventListener('change', syncLabel);
    const mo = new MutationObserver(() => {
      syncLabel();
      if (isMenuOpen()) buildItems();
    });
    mo.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'selected', 'value'] });

    // Keep label in sync if value set programmatically
    const valueDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    if (valueDesc?.set) {
      Object.defineProperty(select, 'value', {
        configurable: true,
        enumerable: true,
        get() { return valueDesc.get.call(this); },
        set(v) {
          valueDesc.set.call(this, v);
          syncLabel();
        }
      });
    }

    buildItems();
    syncLabel();
    wrap._customSelectClose = () => setOpen(false);
    wrap.dataset.overlayId = overlayId;
    return wrap;
  };

  const enhanceFormSelects = (scope = document) => {
    scope.querySelectorAll('select.form-select:not([data-custom-select="1"]):not([data-native-select])')
      .forEach(enhanceFormSelect);
  };

  // ─── Pagination UI ───────────────────────────────────────────

  const renderPagination = (container, page, totalPages, onPageChange) => {
    if (!container) return;
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const pages = [];
    const addPage = (p) => pages.push(p);

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) addPage(i);
    } else {
      addPage(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) addPage(i);
      if (page < totalPages - 2) pages.push('...');
      addPage(totalPages);
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
              return `
                <li class="chevron-pagination__item is-ellipsis" aria-hidden="true">
                  <span class="chevron-pagination__btn">…</span>
                </li>`;
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
      </nav>
    `;

    container.querySelectorAll('[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = Number(btn.dataset.page);
        if (target >= 1 && target <= totalPages && target !== page) {
          pulsePageContent(container);
          if (typeof onPageChange === 'function') onPageChange(target);
        }
      });
    });
  };

  // ─── Table Sort ────────────────────────────────────────────────

  const bindTableSort = (tableEl, onSort) => {
    if (!tableEl) return;
    tableEl.querySelectorAll('th[data-sort]').forEach((th) => {
      if (th.dataset.sortBound) return;
      th.style.cursor = 'pointer';
      th.dataset.sortBound = 'true';
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        const current = th.dataset.sortDir || 'asc';
        const next = current === 'asc' ? 'desc' : 'asc';

        tableEl.querySelectorAll('th[data-sort]').forEach((h) => {
          h.dataset.sortDir = '';
          h.classList.remove('sort-asc', 'sort-desc');
        });
        th.dataset.sortDir = next;
        th.classList.add(next === 'asc' ? 'sort-asc' : 'sort-desc');

        if (typeof onSort === 'function') onSort(field, next);
      });
    });
  };

  // ─── Modal Helpers ─────────────────────────────────────────────

  const MODAL_BTN_MAX_CHARS = 14;

  const getButtonPlainText = (btn) => {
    const clone = btn.cloneNode(true);
    clone.querySelectorAll('i, .bi, svg').forEach((el) => el.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  };

  const shortenModalLabel = (text, max = MODAL_BTN_MAX_CHARS) => {
    const value = String(text || '').trim();
    if (value.length <= max) return value;
    return `${value.slice(0, Math.max(1, max - 1))}…`;
  };

  const normalizeModalButtons = (modalEl) => {
    if (!modalEl) return;
    modalEl.querySelectorAll('.modal-footer .btn').forEach((btn) => {
      btn.classList.add('modal-btn');

      const icon = btn.querySelector('i, .bi, svg');
      const full = btn.dataset.fullLabel || getButtonPlainText(btn);
      if (!full) return;

      btn.dataset.fullLabel = full;
      btn.setAttribute('title', full);
      btn.setAttribute('aria-label', full);

      const short = shortenModalLabel(full);
      btn.textContent = '';
      if (icon) {
        const iconClone = icon.cloneNode(true);
        iconClone.setAttribute('aria-hidden', 'true');
        btn.appendChild(iconClone);
        btn.appendChild(document.createTextNode(' '));
      }
      const label = document.createElement('span');
      label.className = 'modal-btn__label';
      label.textContent = short;
      btn.appendChild(label);
    });
  };

  const enhanceAdminModal = (modalEl) => {
    if (!modalEl) return modalEl;
    modalEl.classList.add('admin-modal');
    const dialog = modalEl.querySelector('.modal-dialog');
    if (dialog) {
      dialog.classList.add('modal-dialog-centered', 'modal-dialog-scrollable');
    }
    const content = modalEl.querySelector('.modal-content');
    if (content) content.classList.add('admin-modal__content');

    // Normalize close control: left, minimal bold red X
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

    // Style any tables like page tables
    modalEl.querySelectorAll('.modal-body table').forEach((table) => {
      table.classList.add('admin-table');
      const existingWrap = table.closest('.table-responsive, .admin-modal__table-wrap');
      if (existingWrap) {
        existingWrap.classList.add('table-responsive', 'admin-modal__table-wrap');
        return;
      }
      const parent = table.parentElement;
      if (!parent) return;
      const shell = document.createElement('div');
      shell.className = 'table-responsive admin-modal__table-wrap';
      parent.insertBefore(shell, table);
      shell.appendChild(table);
    });

    // Detail definition lists → table look
    modalEl.querySelectorAll('.modal-body dl.row').forEach((dl) => {
      dl.classList.add('admin-detail-list');
    });

    normalizeModalButtons(modalEl);
    return modalEl;
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
      modalEl.removeAttribute('aria-hidden');
      document.body.classList.add('modal-open');
    }
  };

  const hideModal = (modalEl) => {
    if (!modalEl) return;
    if (window.bootstrap?.Modal) {
      const instance = window.bootstrap.Modal.getInstance(modalEl);
      if (instance) instance.hide();
    } else {
      modalEl.classList.remove('show');
      modalEl.style.display = 'none';
      modalEl.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    }
  };

  const createModal = ({ id, title, bodyHtml, footerHtml, size = '' }) => {
    let modal = document.getElementById(id);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.className = 'modal fade admin-modal';
    modal.id = id;
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog ${size ? `modal-${size}` : ''} modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content admin-modal__content">
          <div class="modal-header">
            <button type="button" class="modal-close" data-bs-dismiss="modal" aria-label="بستن">
              <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>
            <h5 class="modal-title">${escapeHtml(title)}</h5>
          </div>
          <div class="modal-body">${bodyHtml || ''}</div>
          ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    enhanceAdminModal(modal);
    return modal;
  };

  ShopAdmin.ui = {
    initSidebar,
    initBreadcrumb,
    showToast,
    showConfirmModal,
    showLoading,
    hideLoading,
    renderEmptyState,
    renderSearchableDropdown,
    enhanceFormSelects,
    enhanceFormSelect,
    registerOverlay,
    closeAllOverlays,
    notifyOverlayOpen,
    renderPagination,
    bindTableSort,
    showModal,
    hideModal,
    createModal,
    enhanceAdminModal,
    normalizeModalButtons,
    NAV_ITEMS
  };
})(window.ShopAdmin = window.ShopAdmin || {});
