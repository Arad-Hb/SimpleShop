(async function () {
  if (!await window.PanelLayout.init()) return;
  const form = document.getElementById("category-form") || document.querySelector("form");
  if (!form) return;
  const id = window.Common.query("id");
  const parentSelect = form.parentId || document.getElementById("parentId");

  try {
    const result = await window.Api.get(window.AppConfig.endpoints.adminCategories, { params: { pageIndex: 1, pageSize: 50 } });
    const roots = (result.data.items || []).filter((x) => !x.parentId && String(x.id) !== String(id));
    if (parentSelect) {
      parentSelect.innerHTML = `<option value="">دسته اصلی</option>` + roots.map((x) => `<option value="${x.id}">${window.Common.escapeHtml(x.name)}</option>`).join("");
    }
  } catch (error) {
    window.Common.handleError(error);
  }

  if (id) {
    try {
      const item = (await window.Api.get(window.AppConfig.endpoints.adminCategory(id))).data;
      if (form.name) form.name.value = item.name || "";
      if (form.description) form.description.value = item.description || "";
      if (parentSelect) parentSelect.value = item.parentId || "";
      if (form.sortOrder) form.sortOrder.value = item.sortOrder || 0;
      if (form.slug) form.slug.value = item.slug || "";
      if (form.metaTitle) form.metaTitle.value = item.metaTitle || "";
      if (form.metaDescription) form.metaDescription.value = item.metaDescription || "";
      if (form.isActive) form.isActive.checked = item.isActive;
    } catch (error) {
      window.Common.handleError(error);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.value,
      description: form.description?.value,
      parentId: parentSelect?.value ? Number(parentSelect.value) : null,
      sortOrder: Number(form.sortOrder?.value || 0),
      slug: form.slug?.value,
      metaTitle: form.metaTitle?.value,
      metaDescription: form.metaDescription?.value,
      isActive: form.isActive ? form.isActive.checked : true
    };
    try {
      const result = id
        ? await window.Api.put(window.AppConfig.endpoints.adminCategory(id), payload)
        : await window.Api.post(window.AppConfig.endpoints.adminCategories, payload);
      window.Toast.success(result.data.message);
      const recordId = id || result.data.recordID;
      const file = document.getElementById("image-file")?.files?.[0];
      if (file && recordId) {
        const data = new FormData();
        data.append("file", file);
        await window.Api.upload(window.AppConfig.endpoints.adminCategoryImage(recordId), data);
      }
      location.href = "categories.html";
    } catch (error) {
      window.Common.handleError(error);
    }
  });
})();
