(function (Store) {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    await Store.catalog.ready;
    const { productCard, bindAddButtons, escapeHtml } = Store.ui;
    const q = new URLSearchParams(location.search).get('q') || '';
    const results = Store.catalog.searchProducts(q);

    const input = document.querySelector('[data-store-search] input');
    if (input) input.value = q;

    const title = document.getElementById('search-title');
    const count = document.getElementById('search-count');
    const grid = document.getElementById('search-grid');

    if (title) {
      title.textContent = q ? `نتایج جستجو برای «${q}»` : 'جستجوی محصولات';
    }
    if (count) count.textContent = `${results.length.toLocaleString('fa-IR')} نتیجه`;

    if (grid) {
      grid.innerHTML = results.length
        ? results.map((p) => productCard(p)).join('')
        : `<div class="panel-card empty-cart"><i class="bi bi-search"></i><p>نتیجه‌ای برای «${escapeHtml(q)}» پیدا نشد.</p><a class="btn btn-primary mt-2" href="category.html">مشاهده همه کالاها</a></div>`;
      bindAddButtons(grid);
    }
  });
})(window.SimpleStore = window.SimpleStore || {});
