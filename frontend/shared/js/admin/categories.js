(async function () {
  if (!await window.PanelLayout.init()) return;
  const tbody = document.getElementById("categories-tbody");
  const host = tbody || document.getElementById("categories-table") || document.querySelector("main .admin-content") || document.querySelector("main");

  async function load() {
    const target = tbody || host;
    target.innerHTML = window.Common.loadingMarkup();
    try {
      const result = await window.Api.get(window.AppConfig.endpoints.adminCategories, { params: { pageIndex: 1, pageSize: 50 } });
      const items = result.data.items || [];
      const rows = items.map((c) => `<tr>
          <td>${window.Common.escapeHtml(c.name)}</td>
          <td>${window.Common.escapeHtml(c.parentName || "اصلی")}</td>
          <td>${c.isActive ? "فعال" : "غیرفعال"}</td>
          <td>
            <a class="btn btn-sm btn-outline-primary" href="category-form.html?id=${c.id}">ویرایش</a>
            <button class="btn btn-sm btn-outline-danger" data-del="${c.id}">حذف</button>
          </td>
        </tr>`).join("");
      if (tbody) {
        tbody.innerHTML = rows || `<tr><td colspan="4">دسته‌ای نیست</td></tr>`;
      } else {
        host.innerHTML = `<div class="mb-3"><a class="btn btn-primary" href="category-form.html">افزودن دسته</a></div>
        <table class="table"><thead><tr><th>نام</th><th>والد</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
      }
      host.querySelectorAll("[data-del]").forEach((btn) => btn.addEventListener("click", async () => {
        try {
          const result = await window.Api.delete(window.AppConfig.endpoints.adminCategory(btn.dataset.del));
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
