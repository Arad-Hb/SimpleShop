(async function () {
  const layout = await window.Layout.init();
  const products = layout?.latestProducts || [];
  const categories = window.Layout.getCategories() || [];
  const settings = window.Layout.getSettings() || {};

  const hero = document.querySelector(".hero-copy");
  if (hero && settings.heroTitle) {
    hero.innerHTML = `<span class="eyebrow">فروشگاه آموزشی</span><h1>${window.Common.escapeHtml(settings.heroTitle)}</h1><p>${window.Common.escapeHtml(settings.heroSubtitle || "")}</p><a href="search.html" class="btn btn-light btn-lg">مشاهده محصولات</a>`;
  }

  const strip = document.querySelector("[data-cat-strip]");
  if (strip && categories.length) {
    const tones = ["purple", "charcoal", "pink", "tan", "gold", "teal"];
    strip.innerHTML = categories.map((cat, index) =>
      `<a href="category.html?id=${cat.id}" class="cat-chip" data-tone="${tones[index % tones.length]}"><span class="cat-chip__label">${window.Common.escapeHtml(cat.name)}</span></a>`
    ).join("");
  }

  function fillGrid(id, items) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = items.length ? items.map(window.Common.productCard).join("") : window.Common.emptyMarkup("محصولی موجود نیست.");
    window.Common.bindAddToCart(el);
  }

  fillGrid("deals-rail", products.slice(0, 4));
  fillGrid("best-grid", products.slice(0, 8));
  fillGrid("new-grid", products);
})();
