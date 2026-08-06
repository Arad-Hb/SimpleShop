/**
 * sync.js — همگام‌سازی کاتالوگ Admin با دیتابیس API
 * محصولات / دسته‌ها / تأمین‌کننده‌ها + URL تصویر و بندانگشتی
 */
(function (ShopAdmin) {
  'use strict';

  const mapApiProduct = (dto) => {
    const gallery = Array.isArray(dto.gallery) ? dto.gallery : (Array.isArray(dto.Gallery) ? dto.Gallery : []);
    const imageUrl = dto.imageUrl || dto.ImageUrl || '';
    const thumbnailUrl = dto.thumbnailUrl || dto.ThumbnailUrl || imageUrl || '';
    const images = gallery.length
      ? gallery.map((g, i) => ({
          id: `api-img-${dto.id}-${g.id || g.Id || i}`,
          alt: g.altText || g.AltText || dto.name || '',
          isPrimary: g.isPrimary === true || g.IsPrimary === true || i === 0,
          sortOrder: g.sortOrder ?? g.SortOrder ?? i,
          url: g.url || g.Url || imageUrl,
          thumbnailUrl: g.thumbnailUrl || g.ThumbnailUrl || thumbnailUrl
        }))
      : (imageUrl || thumbnailUrl
        ? [{
            id: `api-img-${dto.id}-primary`,
            alt: dto.name || '',
            isPrimary: true,
            sortOrder: 0,
            url: imageUrl,
            thumbnailUrl
          }]
        : []);

    return {
      id: dto.id,
      name: dto.name || 'محصول',
      sku: dto.sku || `API-${String(dto.id).padStart(4, '0')}`,
      categoryId: dto.categoryId ?? null,
      categoryName: dto.categoryName || '',
      supplierId: dto.supplierId ?? null,
      supplierName: dto.supplierName || '',
      price: Number(dto.price) || 0,
      discountPrice: null,
      stock: Number(dto.stock) || 0,
      minimumStock: 5,
      isActive: true,
      description: dto.description || '',
      imageId: images[0]?.id || null,
      imageUrl,
      thumbnailUrl,
      images,
      rating: 0,
      reviewCount: 0,
      createdAt: dto.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'api',
      seo: {
        metaTitle: dto.metaTitle || '',
        metaDescription: dto.metaDescription || '',
        keywords: dto.metaKeywords || '',
        canonicalUrl: dto.canonicalUrl || '',
        ogTitle: dto.ogTitle || '',
        ogDescription: dto.ogDescription || '',
        ogImageId: null,
        index: true,
        follow: true
      }
    };
  };

  const mapApiCategory = (dto, index) => ({
    id: dto.id,
    name: dto.name || `دسته ${index + 1}`,
    slug: dto.slug || dto.name || `cat-${dto.id}`,
    description: dto.description || '',
    parentId: dto.parentId ?? null,
    parentName: dto.parentName || '',
    sortOrder: dto.sortOrder ?? index + 1,
    depth: dto.depth ?? 0,
    childCount: dto.childCount ?? 0,
    isActive: dto.isActive !== false,
    imageUrl: dto.imageUrl || '',
    thumbnailUrl: dto.thumbnailUrl || '',
    createdAt: new Date().toISOString(),
    source: 'api'
  });

  const mapApiSupplier = (dto) => ({
    id: dto.id,
    name: dto.name || 'تأمین‌کننده',
    contactPerson: dto.contactPerson || '',
    phone: dto.phone || '',
    mobile: dto.mobile || '',
    email: dto.email || '',
    address: dto.address || '',
    isActive: true,
    createdAt: new Date().toISOString(),
    source: 'api'
  });

  const fetchAllProducts = async () => {
    const pageSize = 50;
    let page = 1;
    let all = [];
    let total = Infinity;

    while (all.length < total && page <= 20) {
      const data = await ShopAdmin.api.getProducts({ page, pageSize, sortBy: 'name', sortDir: 'asc' });
      const items = data?.items || data?.Items || [];
      const search = data?.searchModel || data?.SearchModel || {};
      total = Number(search.recordCount ?? search.RecordCount ?? items.length) || items.length;
      all = all.concat(items);
      if (!items.length || items.length < pageSize) break;
      page += 1;
    }

    // Enrich first page of details for gallery URLs when list lacks gallery
    return all;
  };

  /**
   * Pull catalog from API into LocalStorage so all Admin pages see DB data + photos.
   * @returns {Promise<{ok:boolean, products:number, categories:number, suppliers:number, message?:string}>}
   */
  const syncCatalogFromApi = async ({ force = false } = {}) => {
    if (!ShopAdmin.config?.SYNC_FROM_API || !ShopAdmin.api) {
      return { ok: false, products: 0, categories: 0, suppliers: 0, message: 'sync disabled' };
    }

    const data = ShopAdmin.storage.getData();
    const version = ShopAdmin.config.SYNC_VERSION || 1;
    if (!force && data.apiSyncVersion === version && (data.products?.length || 0) >= 50) {
      return {
        ok: true,
        products: data.products.length,
        categories: data.categories?.length || 0,
        suppliers: data.suppliers?.length || 0,
        message: 'cached'
      };
    }

    try {
      const alive = await ShopAdmin.api.ping();
      if (!alive) {
        return { ok: false, products: 0, categories: 0, suppliers: 0, message: 'API offline' };
      }

      await ShopAdmin.api.ensureApiAuth();

      const [productDtos, categoryDtos] = await Promise.all([
        fetchAllProducts(),
        ShopAdmin.api.getCategories()
      ]);

      let supplierDtos = [];
      try {
        const supplierPage = await ShopAdmin.api.getSuppliers();
        supplierDtos = supplierPage?.items || supplierPage?.Items || [];
      } catch {
        // derive from products if suppliers endpoint needs auth and login failed
      }

      const products = (productDtos || []).map(mapApiProduct);
      const categories = (Array.isArray(categoryDtos) ? categoryDtos : []).map(mapApiCategory);

      let suppliers = (supplierDtos || []).map(mapApiSupplier);
      if (!suppliers.length) {
        const map = new Map();
        products.forEach((p) => {
          if (p.supplierId && p.supplierName && !map.has(p.supplierId)) {
            map.set(p.supplierId, {
              id: p.supplierId,
              name: p.supplierName,
              contactPerson: '',
              phone: '',
              mobile: '',
              email: '',
              address: '',
              isActive: true,
              createdAt: new Date().toISOString(),
              source: 'api'
            });
          }
        });
        suppliers = [...map.values()];
      }

      if (!products.length) {
        return { ok: false, products: 0, categories: 0, suppliers: 0, message: 'empty catalog' };
      }

      data.products = products;
      data.categories = categories.length ? categories : data.categories;
      data.suppliers = suppliers.length ? suppliers : data.suppliers;
      data.counters = data.counters || {};
      data.counters.products = products.length;
      data.counters.categories = data.categories.length;
      data.counters.suppliers = data.suppliers.length;
      data.apiSyncVersion = version;
      data.apiSyncedAt = new Date().toISOString();
      ShopAdmin.storage.saveData(data);

      return {
        ok: true,
        products: products.length,
        categories: data.categories.length,
        suppliers: data.suppliers.length
      };
    } catch (err) {
      return {
        ok: false,
        products: 0,
        categories: 0,
        suppliers: 0,
        message: err?.message || 'sync failed'
      };
    }
  };

  ShopAdmin.sync = { syncCatalogFromApi, mapApiProduct };
})(window.ShopAdmin = window.ShopAdmin || {});
