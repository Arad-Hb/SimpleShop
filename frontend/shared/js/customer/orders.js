(async function () {
  if (!await window.PanelLayout.init()) return;
  const tbody = document.getElementById("orders-body");
  const empty = document.getElementById("orders-empty");
  const host = tbody || document.getElementById("orders-root") || document.querySelector("main .content-card, main");

  async function load() {
    host.innerHTML = tbody ? `<tr><td colspan="7">${window.Common.loadingMarkup()}</td></tr>` : window.Common.loadingMarkup();
    try {
      const result = await window.Api.get(window.AppConfig.endpoints.customerOrders, { params: { pageIndex: 1, pageSize: 20 } });
      const items = result.data.items || [];
      if (!items.length) {
        if (tbody) {
          tbody.innerHTML = "";
          empty?.classList.remove("d-none");
        } else {
          host.innerHTML = window.Common.emptyMarkup("سفارشی پیدا نشد.");
        }
        return;
      }
      empty?.classList.add("d-none");
      const rows = items.map((o) => `<tr>
          <td>#${o.id}</td>
          <td>${window.Common.statusTitle(o.status)}</td>
          <td>—</td>
          <td>${o.itemCount ?? "—"}</td>
          <td>${window.Common.formatPrice(o.totalAmount)}</td>
          <td>${window.Common.escapeHtml(o.orderDatePersian || "")}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary" data-view="${o.id}">جزئیات</button>
            ${o.status === "pending" ? `<button class="btn btn-sm btn-outline-danger" data-cancel="${o.id}">لغو</button>` : ""}
          </td>
        </tr>`).join("");
      if (tbody) tbody.innerHTML = rows;
      else host.innerHTML = `<table class="table"><thead><tr><th>شماره</th><th>وضعیت</th><th>مبلغ</th><th></th></tr></thead><tbody>${rows}</tbody></table><div id="order-details"></div>`;
      (tbody || host).querySelectorAll("[data-view]").forEach((btn) => btn.addEventListener("click", () => show(btn.dataset.view)));
      (tbody || host).querySelectorAll("[data-cancel]").forEach((btn) => btn.addEventListener("click", () => cancel(btn.dataset.cancel)));
    } catch (error) {
      const message = window.Api.normalizeError(error).message;
      if (tbody) tbody.innerHTML = `<tr><td colspan="7">${window.Common.errorMarkup(message)}</td></tr>`;
      else host.innerHTML = window.Common.errorMarkup(message);
    }
  }

  async function show(id) {
    try {
      const order = (await window.Api.get(window.AppConfig.endpoints.customerOrder(id))).data;
      const modal = document.getElementById("order-detail-modal");
      if (modal) {
        modal.querySelector("[data-order-number]") && (modal.querySelector("[data-order-number]").textContent = "#" + order.id);
        modal.querySelector("[data-order-status]") && (modal.querySelector("[data-order-status]").textContent = window.Common.statusTitle(order.status));
        modal.querySelector("[data-order-date]") && (modal.querySelector("[data-order-date]").textContent = order.orderDatePersian || "");
        modal.querySelector("[data-order-address]") && (modal.querySelector("[data-order-address]").textContent = order.shippingAddress || "");
        modal.querySelector("[data-order-total]") && (modal.querySelector("[data-order-total]").textContent = window.Common.formatPrice(order.totalAmount));
        modal.querySelector("[data-order-items]") && (modal.querySelector("[data-order-items]").innerHTML =
          (order.items || []).map((i) => `<li>${window.Common.escapeHtml(i.productName)} × ${i.quantity} = ${window.Common.formatPrice(i.lineTotal)}</li>`).join(""));
        if (window.bootstrap?.Modal) window.bootstrap.Modal.getOrCreateInstance(modal).show();
        return;
      }
      window.Toast.info("جزئیات سفارش #" + order.id);
    } catch (error) {
      window.Common.handleError(error);
    }
  }

  async function cancel(id) {
    try {
      const result = await window.Api.post(window.AppConfig.endpoints.customerCancelOrder(id), {});
      window.Toast.success(result.data.message || "سفارش لغو شد.");
      await load();
    } catch (error) {
      window.Common.handleError(error);
    }
  }

  await load();
})();
