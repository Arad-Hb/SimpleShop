/**
 * sync.js — read-only product sync from API for Supplier panel
 */
(function (ShopSupplier) {
  'use strict';

  const pick = (dto, camel, pascal) => dto?.[camel] ?? dto?.[pascal];

  const mapApiProduct = (dto) => ({
    id: String(pick(dto, 'id', 'Id')),
    name: pick(dto, 'name', 'Name') || 'محصول',
    categoryId: pick(dto, 'categoryId', 'CategoryId') ?? null,
    brandName: pick(dto, 'supplierName', 'SupplierName') || pick(dto, 'categoryName', 'CategoryName') || '—',
    brandId: String(pick(dto, 'supplierId', 'SupplierId') || ''),
    price: Number(pick(dto, 'price', 'Price')) || 0,
    stock: Number(pick(dto, 'stock', 'Stock')) || 0,
    lowStockThreshold: 5,
    isActive: pick(dto, 'isActive', 'IsActive') !== false,
    thumbnailUrl: pick(dto, 'thumbnailUrl', 'ThumbnailUrl') || pick(dto, 'imageUrl', 'ImageUrl') || '',
    source: 'api'
  });

  let cachedProducts = [];

  const fetchAllProducts = async () => {
    const pageSize = 50;
    let page = 1;
    let all = [];
    let total = Infinity;

    while (all.length < total && page <= 20) {
      const data = await ShopSupplier.api.getProducts({ page, pageSize, sortBy: 'name', sortDir: 'asc' });
      const items = data?.items || data?.Items || [];
      const search = data?.searchModel || data?.SearchModel || {};
      total = Number(search.recordCount ?? search.RecordCount ?? items.length) || items.length;
      all = all.concat(items.map(mapApiProduct));
      if (!items.length || items.length < pageSize) break;
      page += 1;
    }

    return all;
  };

  const syncProductsFromApi = async () => {
    if (!ShopSupplier.api) return { ok: false, products: 0, message: 'api missing' };

    try {
      const alive = await ShopSupplier.api.ping();
      if (!alive) return { ok: false, products: 0, message: 'API offline' };

      await ShopSupplier.api.ensureApiAuth();
      cachedProducts = await fetchAllProducts();
      return { ok: true, products: cachedProducts.length };
    } catch (err) {
      return { ok: false, products: 0, message: err?.message || 'sync failed' };
    }
  };

  const getProducts = () => cachedProducts.slice();

  ShopSupplier.sync = { syncProductsFromApi, getProducts, mapApiProduct };
})(window.ShopSupplier = window.ShopSupplier || {});
