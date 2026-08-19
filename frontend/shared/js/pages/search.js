(async function () {
  await window.Layout.init();
  const q = window.Common.query("q", "");
  const host = document.getElementById("search-grid") || document.getElementById("search-results") || document.getElementById("product-grid") || document.querySelector("main");
  const input = document.querySelector("[name='q']");
  if (input) input.value = q;

  async function load() {
    if (host) host.innerHTML = window.Common.loadingMarkup();
    try {
      const result = await window.Api.get(window.AppConfig.endpoints.products, {
        params: { term: q, pageIndex: 1, pageSize: window.AppConfig.pageSize }
      });
      const items = result.data.items || [];
      if (host) {
        host.innerHTML = items.length ? items.map(window.Common.productCard).join("") : window.Common.emptyMarkup("محصولی برای این جستجو پیدا نشد.");
        window.Common.bindAddToCart(host);
      }
    } catch (error) {
      if (host) host.innerHTML = window.Common.errorMarkup(window.Api.normalizeError(error).message);
    }
  }

  await load();
})();
