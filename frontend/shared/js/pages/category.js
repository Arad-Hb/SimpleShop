(async function () {
  await window.Layout.init();
  const id = window.Common.query("id");
  const slug = window.Common.query("slug");
  const host = document.getElementById("category-grid") || document.getElementById("category-products") || document.getElementById("product-grid") || document.querySelector("main");
  const title = document.querySelector("#category-title, [data-category-title], h1");

  async function load() {
    if (host) host.innerHTML = window.Common.loadingMarkup();
    try {
      let category = null;
      if (id) category = (await window.Api.get(window.AppConfig.endpoints.categoryDetails(id))).data;
      else if (slug) category = (await window.Api.get(window.AppConfig.endpoints.categoryBySlug(slug))).data;
      if (title && category) title.textContent = category.name;
      const params = { pageIndex: 1, pageSize: window.AppConfig.pageSize };
      if (category) params.categoryId = category.id;
      const result = await window.Api.get(window.AppConfig.endpoints.products, { params });
      const items = result.data.items || [];
      if (host) {
        host.innerHTML = items.length ? items.map(window.Common.productCard).join("") : window.Common.emptyMarkup();
        window.Common.bindAddToCart(host);
      }
    } catch (error) {
      if (host) host.innerHTML = window.Common.errorMarkup(window.Api.normalizeError(error).message);
      host?.querySelector("[data-retry]")?.addEventListener("click", load);
    }
  }

  await load();
})();
