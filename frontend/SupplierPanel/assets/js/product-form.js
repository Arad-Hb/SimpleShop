(function (ShopSupplier) {
  'use strict';

  const { generateId } = ShopSupplier.utils;

  const params = new URLSearchParams(window.location.search);
  const editId = params.get('id');

  document.addEventListener('DOMContentLoaded', () => {
    if (!ShopSupplier.auth.requireAuth()) return;

    ShopSupplier.ui.initBreadcrumb([
      { label: 'خانه', href: 'index.html' },
      { label: 'محصولات من', href: 'products.html' },
      { label: editId ? 'ویرایش محصول' : 'محصول جدید' }
    ]);

    const brandSelect = document.getElementById('brandId');
    const brands = ShopSupplier.storage.getBrands();
    brandSelect.innerHTML = '<option value="">انتخاب برند</option>' +
      brands.map((b) => `<option value="${b.id}">${b.name}</option>`).join('');

    const title = document.getElementById('form-title');
    if (editId) {
      const product = ShopSupplier.storage.getProduct(editId);
      if (!product) {
        ShopSupplier.ui.showToast('error', 'محصول یافت نشد.');
        window.location.href = 'products.html';
        return;
      }
      title.textContent = 'ویرایش محصول';
      document.getElementById('name').value = product.name || '';
      document.getElementById('sku').value = product.sku || '';
      document.getElementById('brandId').value = product.brandId || '';
      document.getElementById('price').value = product.price ?? '';
      document.getElementById('stock').value = product.stock ?? 0;
      document.getElementById('lowStockThreshold').value = product.lowStockThreshold ?? 5;
      document.getElementById('description').value = product.description || '';
      document.getElementById('isActive').checked = product.isActive !== false;
    } else {
      title.textContent = 'افزودن محصول جدید';
    }

    document.getElementById('product-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const brandId = document.getElementById('brandId').value;
      const price = Number(document.getElementById('price').value);
      const stock = Number(document.getElementById('stock').value);

      if (!name) {
        ShopSupplier.ui.showToast('error', 'نام محصول الزامی است.');
        return;
      }
      if (!brandId) {
        ShopSupplier.ui.showToast('error', 'برند را انتخاب کنید.');
        return;
      }
      if (Number.isNaN(price) || price < 0) {
        ShopSupplier.ui.showToast('error', 'قیمت معتبر نیست.');
        return;
      }
      if (Number.isNaN(stock) || stock < 0) {
        ShopSupplier.ui.showToast('error', 'موجودی معتبر نیست.');
        return;
      }

      const brand = brands.find((b) => b.id === brandId);
      const now = new Date().toISOString();
      const existing = editId ? ShopSupplier.storage.getProduct(editId) : null;

      const product = {
        id: existing?.id || generateId('prod'),
        name,
        sku: document.getElementById('sku').value.trim(),
        brandId,
        brandName: brand?.name || '',
        price,
        stock,
        lowStockThreshold: Number(document.getElementById('lowStockThreshold').value) || 5,
        description: document.getElementById('description').value.trim(),
        isActive: document.getElementById('isActive').checked,
        createdAt: existing?.createdAt || now,
        updatedAt: now
      };

      ShopSupplier.storage.saveProduct(product);
      ShopSupplier.ui.showToast('success', editId ? 'محصول ویرایش شد.' : 'محصول افزوده شد.');
      setTimeout(() => { window.location.href = 'products.html'; }, 500);
    });
  });
})(window.ShopSupplier = window.ShopSupplier || {});
