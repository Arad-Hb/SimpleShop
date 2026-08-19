(async function () {
  await window.Layout.init();
  const host = document.getElementById("card-root") || document.getElementById("cart-root") || document.querySelector("main");

  async function load() {
    const lines = window.Cart.read();
    if (!lines.length) {
      host.innerHTML = `<div class="container-xxl py-5">${window.Common.emptyMarkup("سبد خرید خالی است.")}<p class="text-center"><a href="index.html">بازگشت به فروشگاه</a></p></div>`;
      return;
    }
    host.innerHTML = window.Common.loadingMarkup();
    try {
      const products = [];
      for (const line of lines) {
        try {
          const item = (await window.Api.get(window.AppConfig.endpoints.productDetails(line.productId))).data;
          products.push({ ...item, quantity: line.quantity });
        } catch {
          window.Cart.remove(line.productId);
          window.Toast.error("یک محصول نامعتبر از سبد حذف شد.");
        }
      }
      if (!products.length) return load();
      let total = 0;
      const rows = products.map((p) => {
        const qty = Math.min(p.quantity, Math.max(1, p.stock));
        if (qty !== p.quantity) {
          window.Cart.setQuantity(p.id, qty);
          window.Toast.info(`تعداد «${p.name}» با موجودی هماهنگ شد.`);
        }
        const lineTotal = p.price * qty;
        total += lineTotal;
        return `<tr>
          <td><a href="product.html?id=${p.id}">${window.Common.escapeHtml(p.name)}</a></td>
          <td>${window.Common.formatPrice(p.price)}</td>
          <td><input type="number" min="1" max="${p.stock}" value="${qty}" data-qty="${p.id}" class="form-control form-control-sm" style="width:90px"></td>
          <td>${window.Common.formatPrice(lineTotal)}</td>
          <td><button class="btn btn-sm btn-outline-danger" data-remove="${p.id}">حذف</button></td>
        </tr>`;
      }).join("");
      host.innerHTML = `<div class="container-xxl py-4">
        <h1>سبد خرید</h1>
        <table class="table"><thead><tr><th>محصول</th><th>قیمت</th><th>تعداد</th><th>جمع</th><th></th></tr></thead><tbody>${rows}</tbody></table>
        <div class="d-flex justify-content-between align-items-center">
          <strong>جمع کل: ${window.Common.formatPrice(total)}</strong>
          <a class="btn btn-primary" href="checkout.html">ادامه خرید</a>
        </div>
      </div>`;
      host.querySelectorAll("[data-qty]").forEach((input) => {
        input.addEventListener("change", () => {
          window.Cart.setQuantity(input.getAttribute("data-qty"), input.value);
          load();
        });
      });
      host.querySelectorAll("[data-remove]").forEach((btn) => {
        btn.addEventListener("click", () => {
          window.Cart.remove(btn.getAttribute("data-remove"));
          window.Toast.success("محصول از سبد حذف شد.");
          load();
        });
      });
    } catch (error) {
      host.innerHTML = window.Common.errorMarkup(window.Api.normalizeError(error).message);
    }
  }

  await load();
})();
