(async function () {
  if (!await window.PanelLayout.init()) return;
  const tbody = document.getElementById("products-tbody");
  const host = tbody || document.getElementById("products-table") || document.querySelector("main .admin-content") || document.querySelector("main");

  async function load() {
    const target = tbody || host;
    target.innerHTML = window.Common.loadingMarkup();
    try {
      const result = await window.Api.get(window.AppConfig.endpoints.adminProducts, { params: { pageIndex: 1, pageSize: 50 } });
      const items = result.data.items || [];
      const rows = items.map((p) => `<tr>
          <td>${window.Common.escapeHtml(p.name)}</td>
          <td>${window.Common.escapeHtml(p.categoryName)}</td>
          <td>${window.Common.formatPrice(p.price)}</td>
          <td>${p.stock}${p.isLowStock ? " ⚠" : ""}</td>
          <td>
            <a class="btn btn-sm btn-outline-primary" href="product-form.html?id=${p.id}">ویرایش</a>
            <button class="btn btn-sm btn-outline-danger" data-del="${p.id}">حذف</button>
          </td>
        </tr>`).join("");
      if (tbody) tbody.innerHTML = rows || `<tr><td colspan="5">محصولی نیست</td></tr>`;
      else host.innerHTML = `<div class="mb-3"><a class="btn btn-primary" href="product-form.html">افزودن محصول</a></div>
        <table class="table"><thead><tr><th>نام</th><th>دسته</th><th>قیمت</th><th>موجودی</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
      (tbody || host).querySelectorAll("[data-del]").forEach((btn) => btn.addEventListener("click", async () => {
        try {
          const result = await window.Api.delete(window.AppConfig.endpoints.adminProduct(btn.dataset.del));
          window.Toast.success(result.data.message);
          await load();
        } catch (error) {
          window.Common.handleError(error);
        }
      }));
    } catch (error) {
      host.innerHTML = window.Common.errorMarkup(window.Api.normalizeError(error).message);
    }
  }

  await load();
})();
