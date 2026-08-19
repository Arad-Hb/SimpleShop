(async function () {
  if (!await window.PanelLayout.init()) return;
  const tbody = document.getElementById("customers-body");
  const host = tbody || document.getElementById("customers-table") || document.querySelector("main");

  async function load() {
    const target = tbody || host;
    target.innerHTML = `<tr><td colspan="10">${window.Common.loadingMarkup()}</td></tr>`;
    try {
      const result = await window.Api.get(window.AppConfig.endpoints.adminCustomers, { params: { pageIndex: 1, pageSize: 50 } });
      const items = result.data.items || [];
      const rows = items.map((c) => `<tr>
          <td>${window.Common.escapeHtml(c.displayName)}</td>
          <td>${window.Common.escapeHtml(c.mobileNumber)}</td>
          <td>${window.Common.escapeHtml(c.mobileNumber)}</td>
          <td>—</td>
          <td>—</td>
          <td>${c.orderCount ?? 0}</td>
          <td>—</td>
          <td>${c.isActive ? "فعال" : "غیرفعال"}</td>
          <td>${window.Common.escapeHtml(c.createDatePersian || "")}</td>
          <td>
            <a class="btn btn-sm btn-outline-primary" href="customer-form.html?id=${encodeURIComponent(c.id)}">ویرایش</a>
            <button class="btn btn-sm btn-outline-secondary" data-toggle="${c.id}" data-active="${c.isActive}">${c.isActive ? "غیرفعال" : "فعال"}</button>
          </td>
        </tr>`).join("");

      if (tbody) {
        tbody.innerHTML = rows || `<tr><td colspan="10">مشتری‌ای نیست</td></tr>`;
      } else {
        host.innerHTML = `<div class="mb-3"><a class="btn btn-primary" href="customer-form.html">افزودن مشتری</a></div>
          <table class="table"><thead><tr><th>نام</th><th>موبایل</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
      }

      host.querySelectorAll("[data-toggle]").forEach((btn) => btn.addEventListener("click", async () => {
        const active = btn.dataset.active === "true";
        const url = active ? window.AppConfig.endpoints.adminDeactivateCustomer(btn.dataset.toggle) : window.AppConfig.endpoints.adminActivateCustomer(btn.dataset.toggle);
        try {
          const result = await window.Api.post(url, {});
          window.Toast.success(result.data.message);
          await load();
        } catch (error) {
          window.Common.handleError(error);
        }
      }));
    } catch (error) {
      const message = window.Api.normalizeError(error).message;
      if (tbody) tbody.innerHTML = `<tr><td colspan="10">${window.Common.errorMarkup(message)}</td></tr>`;
      else host.innerHTML = window.Common.errorMarkup(message);
    }
  }

  await load();
})();
