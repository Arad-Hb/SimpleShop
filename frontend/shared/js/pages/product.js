(async function () {
  await window.Layout.init();
  const id = window.Common.query("id");
  const host = document.getElementById("product-root") || document.getElementById("product-details") || document.querySelector("main");

  async function load() {
    if (!id) {
      host.innerHTML = window.Common.emptyMarkup("محصول پیدا نشد.");
      return;
    }
    host.innerHTML = window.Common.loadingMarkup();
    try {
      const product = (await window.Api.get(window.AppConfig.endpoints.productDetails(id))).data;
      host.innerHTML = `
        <div class="container-xxl py-4">
          <div class="row g-4">
            <div class="col-md-5"><img class="img-fluid rounded" src="${window.Common.escapeHtml(window.Common.mediaUrl(product.imagePath || product.thumbnailPath))}" alt="${window.Common.escapeHtml(product.name)}"></div>
            <div class="col-md-7">
              <h1>${window.Common.escapeHtml(product.name)}</h1>
              <p class="text-muted">${window.Common.escapeHtml(product.brandName || "")} · ${window.Common.escapeHtml(product.categoryName || "")}</p>
              <div class="fs-4 mb-3">${window.Common.formatPrice(product.price)}</div>
              <p>${window.Common.escapeHtml(product.description || "")}</p>
              <p>موجودی: ${product.stock}</p>
              <div class="d-flex gap-2">
                <input type="number" min="1" max="${Math.max(1, product.stock)}" value="1" id="qty" class="form-control" style="max-width:100px">
                <button class="btn btn-primary" id="add-btn" ${product.stock < 1 ? "disabled" : ""}>افزودن به سبد</button>
              </div>
            </div>
          </div>
        </div>`;
      document.getElementById("add-btn")?.addEventListener("click", () => {
        const qty = Number(document.getElementById("qty").value || 1);
        if (qty > product.stock) {
          window.Toast.error("موجودی کافی نیست.");
          return;
        }
        window.Cart.add(product.id, qty);
        window.Toast.success("محصول به سبد خرید اضافه شد.");
      });
    } catch (error) {
      host.innerHTML = window.Common.errorMarkup(window.Api.normalizeError(error).message);
    }
  }

  await load();
})();
