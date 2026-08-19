(async function () {
  if (!await window.PanelLayout.init()) return;
  try {
    const data = (await window.Api.get(window.AppConfig.endpoints.adminDashboard)).data;
    const map = {
      totalProducts: data.productCount,
      activeProducts: data.productCount,
      categories: data.categoryCount,
      customers: data.customerCount,
      orders: data.orderCount,
      lowStock: data.lowStockCount
    };
    Object.entries(map).forEach(([key, value]) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (el) el.textContent = value ?? "0";
    });
    const recent = document.getElementById("recent-orders");
    if (recent) {
      recent.innerHTML = (data.recentOrders || []).map((o) =>
        `<tr><td>#${o.id}</td><td>${window.Common.escapeHtml(o.customerName)}</td><td>${window.Common.statusTitle(o.status)}</td><td>${window.Common.formatPrice(o.totalAmount)}</td></tr>`
      ).join("") || `<tr><td colspan="4">سفارشی نیست</td></tr>`;
    }
  } catch (error) {
    window.Common.handleError(error);
  }
})();
