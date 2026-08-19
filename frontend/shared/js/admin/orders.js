(async function () {
  if (!await window.PanelLayout.init()) return;
  const tbody = document.getElementById("orders-body");
  const host = tbody || document.getElementById("orders-table") || document.querySelector("main");

  async function load() {
    const target = tbody || host;
    target.innerHTML = `<tr><td colspan="7">${window.Common.loadingMarkup()}</td></tr>`;
    try {
      const result = await window.Api.get(window.AppConfig.endpoints.adminOrders, { params: { pageIndex: 1, pageSize: 50 } });
      const items = result.data.items || [];
      const rows = items.map((o) => `<tr>
          <td>#${o.id}</td>
          <td>${window.Common.escapeHtml(o.customerName)}</td>
          <td>${window.Common.formatPrice(o.totalAmount)}</td>
          <td>${window.Common.statusTitle(o.status)}</td>
          <td>—</td>
          <td>${window.Common.escapeHtml(o.orderDatePersian || "")}</td>
          <td><a class="btn btn-sm btn-outline-primary" href="order-details.html?id=${o.id}">جزئیات</a></td>
        </tr>`).join("");
      if (tbody) tbody.innerHTML = rows || `<tr><td colspan="7">سفارشی نیست</td></tr>`;
      else host.innerHTML = `<table class="table"><thead><tr><th>شماره</th><th>مشتری</th><th>وضعیت</th><th>مبلغ</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
    } catch (error) {
      const message = window.Api.normalizeError(error).message;
      if (tbody) tbody.innerHTML = `<tr><td colspan="7">${window.Common.errorMarkup(message)}</td></tr>`;
      else host.innerHTML = window.Common.errorMarkup(message);
    }
  }

  await load();
})();
