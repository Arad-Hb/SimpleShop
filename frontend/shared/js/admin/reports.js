(async function () {
  if (!await window.PanelLayout.init()) return;
  document.querySelector(".filter-bar")?.classList.add("d-none");
  document.getElementById("btn-export-csv")?.classList.add("d-none");
  const host = document.getElementById("reports-root") || document.querySelector("main .page-header") || document.querySelector("main");
  try {
    const data = (await window.Api.get(window.AppConfig.endpoints.adminDashboard)).data;
    const html = `<div class="row g-3 mb-4">
      <div class="col-md-3"><div class="stat-card"><div class="stat-value">${data.orderCount}</div><div class="stat-label">سفارش‌ها</div></div></div>
      <div class="col-md-3"><div class="stat-card"><div class="stat-value">${window.Common.formatPrice(data.salesTotal)}</div><div class="stat-label">فروش غیرلغو</div></div></div>
      <div class="col-md-3"><div class="stat-card"><div class="stat-value">${data.lowStockCount}</div><div class="stat-label">کم‌موجود</div></div></div>
      <div class="col-md-3"><div class="stat-card"><div class="stat-value">${data.customerCount}</div><div class="stat-label">مشتریان</div></div></div>
    </div>
    <div class="content-card"><div class="table-responsive"><table class="table mb-0"><thead><tr><th>وضعیت</th><th>تعداد</th><th>مبلغ</th></tr></thead><tbody>
      ${(data.ordersByStatus || []).map((s) => `<tr><td>${window.Common.escapeHtml(s.statusTitle || window.Common.statusTitle(s.status))}</td><td>${s.count}</td><td>${window.Common.formatPrice(s.totalAmount)}</td></tr>`).join("")}
    </tbody></table></div></div>`;
    if (document.getElementById("reports-root")) document.getElementById("reports-root").innerHTML = html;
    else host.insertAdjacentHTML("afterend", `<div id="reports-root">${html}</div>`);
  } catch (error) {
    window.Common.handleError(error);
  }
})();
