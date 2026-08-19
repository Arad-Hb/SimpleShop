(async function () {
  if (!await window.PanelLayout.init()) return;
  const id = window.Common.query("id");
  const host = document.getElementById("order-details") || document.querySelector("main");
  if (!id) {
    host.innerHTML = window.Common.emptyMarkup("سفارش پیدا نشد.");
    return;
  }

  async function load() {
    host.innerHTML = window.Common.loadingMarkup();
    try {
      const order = (await window.Api.get(window.AppConfig.endpoints.adminOrder(id))).data;
      const nextOptions = ["pending", "processing", "shipped", "delivered", "cancelled"]
        .map((s) => `<option value="${s}" ${s === order.status ? "selected" : ""}>${window.Common.statusTitle(s)}</option>`)
        .join("");
      host.innerHTML = `<div class="content-card p-3">
        <h2>سفارش #${order.id}</h2>
        <p>${window.Common.escapeHtml(order.customerName)} — ${window.Common.escapeHtml(order.shippingMobile)}</p>
        <p>${window.Common.escapeHtml(order.shippingAddress)}</p>
        <ul>${order.items.map((i) => `<li>${window.Common.escapeHtml(i.productName)} × ${i.quantity} = ${window.Common.formatPrice(i.lineTotal)}</li>`).join("")}</ul>
        <p><strong>${window.Common.formatPrice(order.totalAmount)}</strong></p>
        <div class="d-flex gap-2">
          <select id="status" class="form-select" style="max-width:220px">${nextOptions}</select>
          <button class="btn btn-primary" id="save-status">ذخیره وضعیت</button>
          ${order.canCancel ? `<button class="btn btn-outline-danger" id="cancel-order">لغو</button>` : ""}
        </div>
      </div>`;
      document.getElementById("save-status")?.addEventListener("click", async () => {
        try {
          const result = await window.Api.put(window.AppConfig.endpoints.adminOrderStatus(id), { status: document.getElementById("status").value });
          window.Toast.success(result.data.message);
          await load();
        } catch (error) {
          window.Common.handleError(error);
        }
      });
      document.getElementById("cancel-order")?.addEventListener("click", async () => {
        try {
          const result = await window.Api.post(window.AppConfig.endpoints.adminCancelOrder(id), {});
          window.Toast.success(result.data.message);
          await load();
        } catch (error) {
          window.Common.handleError(error);
        }
      });
    } catch (error) {
      host.innerHTML = window.Common.errorMarkup(window.Api.normalizeError(error).message);
    }
  }

  await load();
})();
