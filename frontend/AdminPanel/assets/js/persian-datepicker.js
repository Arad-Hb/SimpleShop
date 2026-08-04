/**
 * Persian (Jalali) date picker for Admin filters.
 * UI shows Shamsi dates; the bound hidden/text value stays Gregorian YYYY-MM-DD.
 */
(function (global) {
  'use strict';

  const MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
  const GREGORIAN_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const toFaDigits = (value) => String(value).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

  const pad2 = (n) => String(n).padStart(2, '0');

  const parseGregorian = (ymd) => {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    const [y, m, d] = ymd.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (Number.isNaN(date.getTime())) return null;
    return { gy: y, gm: m, gd: d, date };
  };

  // Algorithm adapted from jalaali-js
  const div = (a, b) => ~~(a / b);
  const mod = (a, b) => a - ~~(a / b) * b;

  const g2d = (gy, gm, gd) => {
    let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
      + div(153 * mod(gm + 9, 12) + 2, 5)
      + gd - 34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
  };

  const d2g = (jdn) => {
    let j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    const i = div(mod(j, 1461), 4) * 5 + 308;
    const gd = div(mod(i, 153), 5) + 1;
    const gm = mod(div(i, 153), 12) + 1;
    const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy, gm, gd };
  };

  const jalCal = (jy) => {
    const breaks = [
      -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
      1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
    ];
    const bl = breaks.length;
    const gy = jy + 621;
    let leapJ = -14;
    let jp = breaks[0];
    let jump = 0;
    let jm;
    let n;
    let i;

    if (jy < jp || jy >= breaks[bl - 1]) {
      throw new Error('Invalid Jalali year ' + jy);
    }

    for (i = 1; i < bl; i += 1) {
      jm = breaks[i];
      jump = jm - jp;
      if (jy < jm) break;
      leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

    const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    const march = 20 + leapJ - leapG;

    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    let leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;

    return { leap, gy, march };
  };

  const j2d = (jy, jm, jd) => {
    const r = jalCal(jy);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  };

  const d2j = (jdn) => {
    const g = d2g(jdn);
    let jy = g.gy - 621;
    const r = jalCal(jy);
    const jdn1f = g2d(g.gy, 3, r.march);
    let k = jdn - jdn1f;
    let jm;
    let jd;
    if (k >= 0) {
      if (k <= 185) {
        jm = 1 + div(k, 31);
        jd = mod(k, 31) + 1;
        return { jy, jm, jd };
      }
      k -= 186;
    } else {
      jy -= 1;
      k += 179;
      if (r.leap === 1) k += 1;
    }
    jm = 7 + div(k, 30);
    jd = mod(k, 30) + 1;
    return { jy, jm, jd };
  };

  const toJalali = (gy, gm, gd) => d2j(g2d(gy, gm, gd));
  const toGregorian = (jy, jm, jd) => d2g(j2d(jy, jm, jd));

  const formatJalaliDisplay = (gy, gm, gd) => {
    const j = toJalali(gy, gm, gd);
    return toFaDigits(`${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`);
  };

  const formatGregorianYmd = (gy, gm, gd) => `${gy}-${pad2(gm)}-${pad2(gd)}`;

  const todayParts = () => {
    const now = new Date();
    return { gy: now.getFullYear(), gm: now.getMonth() + 1, gd: now.getDate() };
  };

  let openPicker = null;
  let placeCleanup = null;
  let closeTimer = null;
  const CLOSE_ANIM_MS = 180;

  const clearPlaceListeners = () => {
    if (typeof placeCleanup === 'function') {
      placeCleanup();
      placeCleanup = null;
    }
  };

  const prefersReducedMotion = () =>
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getDatepickerWidth = () => {
    const vw = window.innerWidth || 1200;
    if (vw < 380) return Math.min(188, vw - 12);
    if (vw < 576) return 204;
    return 228;
  };

  const closeOpenPicker = (immediate = false) => {
    clearPlaceListeners();
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (!openPicker) return;
    const panel = openPicker;
    openPicker = null;
    if (immediate || prefersReducedMotion()) {
      panel.remove();
      return;
    }
    panel.classList.add('is-leaving');
    closeTimer = window.setTimeout(() => {
      panel.remove();
      closeTimer = null;
    }, CLOSE_ANIM_MS);
  };

  const DATEPICKER_OVERLAY_ID = 'persian-datepicker';

  const registerDatepickerOverlay = () => {
    const ui = global.ShopAdmin && global.ShopAdmin.ui;
    if (!ui || typeof ui.registerOverlay !== 'function') return;
    ui.registerOverlay(DATEPICKER_OVERLAY_ID, closeOpenPicker);
  };

  const notifyOtherOverlays = () => {
    const ui = global.ShopAdmin && global.ShopAdmin.ui;
    if (ui && typeof ui.notifyOverlayOpen === 'function') {
      ui.notifyOverlayOpen(DATEPICKER_OVERLAY_ID);
    }
  };

  const placeFixedPanel = (panel, anchorEl, { width = 228, gap = 6 } = {}) => {
    if (!panel || !anchorEl) return;
    const margin = 8;
    const rect = anchorEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxW = Math.min(width, Math.max(168, vw - margin * 2));
    panel.style.position = 'fixed';
    panel.style.width = `${maxW}px`;
    panel.style.maxWidth = `${maxW}px`;
    panel.style.right = 'auto';

    let left = document.documentElement.dir === 'rtl' ? rect.right - maxW : rect.left;
    left = Math.min(Math.max(left, margin), vw - maxW - margin);

    panel.style.left = `${left}px`;
    panel.style.top = `${rect.bottom + gap}px`;

    const panelRect = panel.getBoundingClientRect();
    if (panelRect.bottom > vh - margin) {
      const above = Math.max(margin, rect.top - panelRect.height - gap);
      panel.style.top = `${above}px`;
    }
  };

  const bindPlaceOnViewport = (placeFn) => {
    clearPlaceListeners();
    const onMove = () => placeFn();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    placeCleanup = () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  };

  const daysInJalaliMonth = (jy, jm) => {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return jalCal(jy).leap === 1 ? 30 : 29;
  };

  const weekdayOfJalali = (jy, jm, jd) => {
    // JS: 0=Sun ... 6=Sat → Persian week starts Saturday
    const g = toGregorian(jy, jm, jd);
    const dow = new Date(g.gy, g.gm - 1, g.gd).getDay();
    return (dow + 1) % 7;
  };

  const updateDisplay = (root) => {
    const hidden = root.querySelector('[data-persian-value]');
    const display = root.querySelector('.persian-datepicker__display');
    if (!hidden || !display) return;
    const parsed = parseGregorian(hidden.value);
    display.value = parsed ? formatJalaliDisplay(parsed.gy, parsed.gm, parsed.gd) : '';
  };

  const setGregorianValue = (root, ymd, triggerChange = true) => {
    const hidden = root.querySelector('[data-persian-value]');
    if (!hidden) return;
    hidden.value = ymd || '';
    updateDisplay(root);
    if (triggerChange) {
      hidden.dispatchEvent(new Event('change', { bubbles: true }));
      hidden.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const renderCalendar = (root, viewJy, viewJm) => {
    closeOpenPicker(true);

    const display = root.querySelector('.persian-datepicker__display');
    const panel = document.createElement('div');
    panel.className = 'persian-datepicker__panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'تقویم شمسی');

    const header = document.createElement('div');
    header.className = 'persian-datepicker__header';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'persian-datepicker__nav';
    prevBtn.setAttribute('aria-label', 'ماه قبل');
    prevBtn.innerHTML = '<i class="bi bi-chevron-right" aria-hidden="true"></i>';

    const title = document.createElement('div');
    title.className = 'persian-datepicker__title';
    title.textContent = `${MONTHS[viewJm - 1]} ${toFaDigits(viewJy)}`;

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'persian-datepicker__nav';
    nextBtn.setAttribute('aria-label', 'ماه بعد');
    nextBtn.innerHTML = '<i class="bi bi-chevron-left" aria-hidden="true"></i>';

    header.append(prevBtn, title, nextBtn);

    const weekRow = document.createElement('div');
    weekRow.className = 'persian-datepicker__weekdays';
    WEEKDAYS.forEach((w, idx) => {
      const cell = document.createElement('span');
      cell.className = 'persian-datepicker__weekday' + (idx === 6 ? ' is-friday' : '');
      cell.textContent = w;
      weekRow.appendChild(cell);
    });

    const grid = document.createElement('div');
    grid.className = 'persian-datepicker__days';

    const selected = parseGregorian(root.querySelector('[data-persian-value]')?.value);
    const selectedJ = selected ? toJalali(selected.gy, selected.gm, selected.gd) : null;
    const today = todayParts();
    const todayJ = toJalali(today.gy, today.gm, today.gd);

    const offset = weekdayOfJalali(viewJy, viewJm, 1);
    const dim = daysInJalaliMonth(viewJy, viewJm);

    let prevJy = viewJy;
    let prevJm = viewJm - 1;
    if (prevJm < 1) {
      prevJm = 12;
      prevJy -= 1;
    }
    const prevDim = daysInJalaliMonth(prevJy, prevJm);

    let nextJy = viewJy;
    let nextJm = viewJm + 1;
    if (nextJm > 12) {
      nextJm = 1;
      nextJy += 1;
    }

    const appendDay = (jy, jm, day, outside) => {
      const weekday = weekdayOfJalali(jy, jm, day);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'persian-datepicker__day';
      if (outside) btn.classList.add('is-outside');
      if (weekday === 6) btn.classList.add('is-friday');
      btn.textContent = toFaDigits(day);

      if (selectedJ && selectedJ.jy === jy && selectedJ.jm === jm && selectedJ.jd === day) {
        btn.classList.add('is-selected');
      }
      if (todayJ.jy === jy && todayJ.jm === jm && todayJ.jd === day) {
        btn.classList.add('is-today');
      }

      btn.addEventListener('click', () => {
        const g = toGregorian(jy, jm, day);
        setGregorianValue(root, formatGregorianYmd(g.gy, g.gm, g.gd), true);
        closeOpenPicker();
      });

      grid.appendChild(btn);
    };

    for (let i = 0; i < offset; i += 1) {
      appendDay(prevJy, prevJm, prevDim - offset + i + 1, true);
    }

    for (let day = 1; day <= dim; day += 1) {
      appendDay(viewJy, viewJm, day, false);
    }

    const filled = offset + dim;
    const trailing = (7 - (filled % 7)) % 7;
    for (let day = 1; day <= trailing; day += 1) {
      appendDay(nextJy, nextJm, day, true);
    }

    const footer = document.createElement('div');
    footer.className = 'persian-datepicker__footer';

    const todayBtn = document.createElement('button');
    todayBtn.type = 'button';
    todayBtn.className = 'persian-datepicker__today';
    todayBtn.textContent = 'امروز';
    todayBtn.addEventListener('click', () => {
      const t = todayParts();
      setGregorianValue(root, formatGregorianYmd(t.gy, t.gm, t.gd), true);
      closeOpenPicker();
    });

    const midG = toGregorian(viewJy, viewJm, Math.min(15, dim));
    const gMonth = document.createElement('span');
    gMonth.className = 'persian-datepicker__gmonth';
    gMonth.textContent = GREGORIAN_MONTHS[midG.gm - 1] || '';

    footer.append(todayBtn, gMonth);
    panel.append(header, weekRow, grid, footer);

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderCalendar(root, prevJy, prevJm);
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderCalendar(root, nextJy, nextJm);
    });

    document.body.appendChild(panel);
    openPicker = panel;
    openPicker._root = root;

    const place = () => placeFixedPanel(panel, display || root, { width: getDatepickerWidth(), gap: 6 });
    place();
    bindPlaceOnViewport(place);
  };

  const openCalendar = (root) => {
    const hidden = root.querySelector('[data-persian-value]');
    const parsed = parseGregorian(hidden?.value);
    let jy;
    let jm;
    if (parsed) {
      const j = toJalali(parsed.gy, parsed.gm, parsed.gd);
      jy = j.jy;
      jm = j.jm;
    } else {
      const t = todayParts();
      const j = toJalali(t.gy, t.gm, t.gd);
      jy = j.jy;
      jm = j.jm;
    }
    renderCalendar(root, jy, jm);
  };

  const enhanceInput = (input) => {
    if (!input || input.dataset.persianEnhanced === '1') return;
    input.dataset.persianEnhanced = '1';

    const root = document.createElement('div');
    root.className = 'persian-datepicker';

    const display = document.createElement('input');
    display.type = 'text';
    display.className = `form-control form-control-sm persian-datepicker__display ${input.classList.contains('form-control') ? '' : ''}`.trim();
    display.readOnly = true;
    display.placeholder = input.getAttribute('placeholder') || 'انتخاب تاریخ شمسی';
    display.setAttribute('aria-label', input.getAttribute('aria-label') || 'تاریخ شمسی');
    display.autocomplete = 'off';
    if (input.id) {
      display.id = `${input.id}-display`;
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) label.setAttribute('for', display.id);
    }

    const icon = document.createElement('span');
    icon.className = 'persian-datepicker__icon';
    icon.innerHTML = '<i class="bi bi-calendar3" aria-hidden="true"></i>';

    // Keep Gregorian YYYY-MM-DD here for filters / API search
    input.type = 'hidden';
    input.removeAttribute('min');
    input.removeAttribute('max');
    input.setAttribute('data-persian-value', '');

    input.parentNode.insertBefore(root, input);
    root.appendChild(display);
    root.appendChild(icon);
    root.appendChild(input);

    updateDisplay(root);

    const open = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (openPicker && openPicker._root === root) {
        closeOpenPicker();
        return;
      }
      notifyOtherOverlays();
      openCalendar(root);
    };

    display.addEventListener('click', open);
    icon.addEventListener('click', open);
    display.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        open(e);
      } else if (e.key === 'Escape') {
        closeOpenPicker();
      }
    });
  };

  const init = (scope = document) => {
    registerDatepickerOverlay();
    scope.querySelectorAll('input[type="date"][data-persian-calendar], input.data-persian-calendar, input[data-persian-calendar]')
      .forEach(enhanceInput);

    // Also support class
    scope.querySelectorAll('input.persian-calendar-input').forEach(enhanceInput);
  };

  const refresh = (idOrEl) => {
    const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
    if (!el) return;
    const root = el.closest('.persian-datepicker');
    if (root) updateDisplay(root);
  };

  const setValue = (idOrEl, ymd, triggerChange = false) => {
    const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
    if (!el) return;
    const root = el.closest('.persian-datepicker');
    if (root) {
      setGregorianValue(root, ymd || '', triggerChange);
    } else {
      el.value = ymd || '';
    }
  };

  document.addEventListener('click', (e) => {
    if (openPicker && !e.target.closest('.persian-datepicker') && !e.target.closest('.persian-datepicker__panel')) {
      closeOpenPicker();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeOpenPicker();
  });

  global.PersianDatePicker = {
    init,
    refresh,
    setValue,
    toJalali,
    toGregorian,
    formatJalaliDisplay
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})(window);
