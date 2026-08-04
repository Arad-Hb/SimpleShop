(function (ShopSupplier) {
  'use strict';

  const { escapeHtml, generateId, formatDate } = ShopSupplier.utils;

  const render = () => {
    const brands = ShopSupplier.storage.getBrands();
    const products = ShopSupplier.storage.getProducts();
    const tbody = document.getElementById('brands-body');
    const empty = document.getElementById('brands-empty');
    if (!tbody) return;

    if (!brands.length) {
      tbody.innerHTML = '';
      empty?.classList.remove('d-none');
      return;
    }
    empty?.classList.add('d-none');

    tbody.innerHTML = brands.map((b) => {
      const count = products.filter((p) => p.brandId === b.id).length;
      return `
        <tr>
          <td class="fw-semibold">${escapeHtml(b.name)}</td>
          <td>${escapeHtml(b.description || '—')}</td>
          <td><span class="supplier-badge"><i class="bi bi-box"></i> ${count.toLocaleString('fa-IR')} محصول</span></td>
          <td>${formatDate(b.createdAt)}</td>
          <td class="text-nowrap">
            <button type="button" class="btn btn-sm btn-outline-primary" data-edit="${escapeHtml(b.id)}">
              <i class="bi bi-pencil"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-danger" data-delete="${escapeHtml(b.id)}">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>`;
    }).join('');
  };

  const resetForm = () => {
    document.getElementById('brand-id').value = '';
    document.getElementById('brand-name').value = '';
    document.getElementById('brand-description').value = '';
    document.getElementById('brand-form-title').textContent = 'افزودن برند';
    document.getElementById('btn-cancel-edit')?.classList.add('d-none');
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (!ShopSupplier.auth.requireAuth()) return;

    ShopSupplier.ui.initBreadcrumb([
      { label: 'خانه', href: 'index.html' },
      { label: 'برندهای من' }
    ]);

    render();

    document.getElementById('brand-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('brand-name').value.trim();
      if (!name) {
        ShopSupplier.ui.showToast('error', 'نام برند الزامی است.');
        return;
      }
      const id = document.getElementById('brand-id').value || generateId('brand');
      const existing = ShopSupplier.storage.getBrands().find((b) => b.id === id);
      ShopSupplier.storage.saveBrand({
        id,
        name,
        description: document.getElementById('brand-description').value.trim(),
        createdAt: existing?.createdAt || new Date().toISOString()
      });
      // sync brandName on products
      const data = ShopSupplier.storage.getData();
      data.products = (data.products || []).map((p) =>
        p.brandId === id ? { ...p, brandName: name } : p
      );
      ShopSupplier.storage.saveData(data);

      ShopSupplier.ui.showToast('success', 'برند ذخیره شد.');
      resetForm();
      render();
    });

    document.getElementById('btn-cancel-edit')?.addEventListener('click', resetForm);

    document.getElementById('brands-body')?.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-edit]');
      if (editBtn) {
        const brand = ShopSupplier.storage.getBrands().find((b) => b.id === editBtn.dataset.edit);
        if (!brand) return;
        document.getElementById('brand-id').value = brand.id;
        document.getElementById('brand-name').value = brand.name;
        document.getElementById('brand-description').value = brand.description || '';
        document.getElementById('brand-form-title').textContent = 'ویرایش برند';
        document.getElementById('btn-cancel-edit')?.classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const delBtn = e.target.closest('[data-delete]');
      if (delBtn) {
        if (confirm('حذف برند؟ محصولات مرتبط بدون برند می‌مانند.')) {
          ShopSupplier.storage.deleteBrand(delBtn.dataset.delete);
          ShopSupplier.ui.showToast('success', 'برند حذف شد.');
          resetForm();
          render();
        }
      }
    });
  });
})(window.ShopSupplier = window.ShopSupplier || {});
