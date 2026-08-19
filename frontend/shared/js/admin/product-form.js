(async function () {
  if (!await window.PanelLayout.init()) return;
  const form = document.getElementById("product-form") || document.querySelector("form");
  if (!form) return;
  const id = window.Common.query("id");
  const categorySelect = form.categoryId || document.getElementById("categoryId");

  try {
    const result = await window.Api.get(window.AppConfig.endpoints.adminCategories, { params: { pageIndex: 1, pageSize: 100 } });
    const children = (result.data.items || []).filter((x) => x.parentId);
    if (categorySelect) {
      categorySelect.innerHTML = `<option value="">انتخاب کنید...</option>` + children.map((x) =>
        `<option value="${x.id}">${window.Common.escapeHtml((x.parentName ? x.parentName + " / " : "") + x.name)}</option>`
      ).join("");
    }
  } catch (error) {
    window.Common.handleError(error);
  }

  document.getElementById("supplierId")?.removeAttribute("required");
  document.getElementById("supplierId")?.closest(".mb-3, .col-md-6")?.classList.add("d-none");

  if (id) {
    try {
      const item = (await window.Api.get(window.AppConfig.endpoints.adminProduct(id))).data;
      ["name", "description", "price", "stock", "minimumStock", "brandName", "slug", "metaTitle", "metaDescription"].forEach((key) => {
        if (form[key]) form[key].value = item[key] ?? "";
      });
      if (categorySelect) categorySelect.value = item.categoryId;
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
      price: Number(form.price?.value || 0),
      stock: Number(form.stock?.value || 0),
      minimumStock: Number(form.minimumStock?.value || 5),
      categoryId: Number(categorySelect?.value || 0),
      brandName: form.brandName?.value,
      isActive: form.isActive ? form.isActive.checked : true,
      slug: form.slug?.value,
      metaTitle: form.metaTitle?.value,
      metaDescription: form.metaDescription?.value
    };
    try {
      const result = id
        ? await window.Api.put(window.AppConfig.endpoints.adminProduct(id), payload)
        : await window.Api.post(window.AppConfig.endpoints.adminProducts, payload);
      window.Toast.success(result.data.message);
      const recordId = id || result.data.recordID;
      const file = document.getElementById("image-file-input") || document.getElementById("image-file") || document.querySelector("input[type=file]");
      if (file?.files?.[0] && recordId) {
        const data = new FormData();
        data.append("file", file.files[0]);
        await window.Api.upload(window.AppConfig.endpoints.adminProductImage(recordId), data);
        window.Toast.success("تصویر محصول ذخیره شد.");
      }
      location.href = "products.html";
    } catch (error) {
      window.Common.handleError(error);
    }
  });
})();
