(function (Store) {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    await Store.catalog.ready;
    const { productCard, bindAddButtons, escapeHtml } = Store.ui;
    const { PRODUCTS, CATEGORIES, getByCategory, TAG_LABELS } = Store.catalog;
    const params = new URLSearchParams(location.search);
    const catId = params.get('id') || params.get('cat');
    const tag = params.get('tag');

    let list = PRODUCTS.slice();
    let title = 'همه محصولات';

    if (tag && TAG_LABELS[tag]) {
      list = PRODUCTS.filter((p) => p.tag === tag || (tag === 'amazing' && p.amazing));
      title = TAG_LABELS[tag];
    } else if (catId) {
      const cat = CATEGORIES.find((c) => c.id === catId);
      list = getByCategory(catId);
      title = cat?.name || 'دسته‌بندی';
    }

    const titleEl = document.getElementById('category-title');
    const countEl = document.getElementById('category-count');
    const grid = document.getElementById('category-grid');
    const chips = document.getElementById('category-chips');

    if (titleEl) {
      titleEl.innerHTML = tag
        ? `<span class="offer-tag tag-${escapeHtml(tag)}">${escapeHtml(title)}</span>`
        : escapeHtml(title);
    }
    if (countEl) countEl.textContent = `${list.length.toLocaleString('fa-IR')} کالا`;

    if (chips) {
      chips.innerHTML = `
        <a class="brand-tile ${!catId && !tag ? 'active-chip' : ''}" href="category.html">همه</a>
        <a class="brand-tile" href="category.html?tag=amazing"><span class="offer-tag tag-amazing">شگفت‌انگیز</span></a>
        <a class="brand-tile" href="category.html?tag=special"><span class="offer-tag tag-special">ویژه</span></a>
        <a class="brand-tile" href="category.html?tag=sale"><span class="offer-tag tag-sale">تخفیف</span></a>
        ${CATEGORIES.map((c) => `
          <a class="brand-tile ${catId === c.id ? 'active-chip' : ''}" href="category.html?id=${encodeURIComponent(c.id)}">
            <i class="bi ${escapeHtml(c.icon)}"></i> ${escapeHtml(c.name)}
          </a>`).join('')}`;
    }

    if (grid) {
      grid.innerHTML = list.length
        ? list.map((p) => productCard(p, { deal: p.amazing })).join('')
        : '<div class="panel-card empty-cart w-100"><p>کالایی در این بخش نیست.</p></div>';
      bindAddButtons(grid);
    }
  });
})(window.SimpleStore = window.SimpleStore || {});
