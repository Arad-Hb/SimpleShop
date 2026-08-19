(async function () {
  const user = await window.PanelLayout.init();
  if (!user) return;
  document.getElementById("dash-greet") && (document.getElementById("dash-greet").textContent = window.Auth.displayName(user));
  const host = document.getElementById("recent-orders");
  try {
    const result = await window.Api.get(window.AppConfig.endpoints.customerOrders, { params: { pageIndex: 1, pageSize: 20 } });
    const items = result.data.items || [];
    const pending = items.filter((o) => o.status === "pending").length;
    const delivered = items.filter((o) => o.status === "delivered").length;
    const spent = items.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    set("stat-orders", items.length);
    set("stat-paid", delivered);
    set("stat-pending", pending);
    set("stat-spent", window.Common.formatPrice(spent));
    set("stat-carts", window.Cart ? window.Cart.read().length : 0);
    set("stat-cart-items", window.Cart ? window.Cart.count() : 0);
    if (host) {
      host.innerHTML = items.length
        ? items.slice(0, 5).map((o) => `<tr>
            <td>#${o.id}</td>
            <td>${window.Common.statusTitle(o.status)}</td>
            <td>${window.Common.formatPrice(o.totalAmount)}</td>
            <td>${window.Common.escapeHtml(o.orderDatePersian || "")}</td>
            <td class="text-center"><a class="btn btn-sm btn-outline-primary" href="orders.html">مشاهده</a></td>
          </tr>`).join("")
        : `<tr><td colspan="5">${window.Common.emptyMarkup("هنوز سفارشی ندارید.")}</td></tr>`;
    }
  } catch (error) {
    if (host) host.innerHTML = `<tr><td colspan="5">${window.Common.errorMarkup(window.Api.normalizeError(error).message)}</td></tr>`;
  }
})();
