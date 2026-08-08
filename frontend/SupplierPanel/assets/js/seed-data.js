/**
 * seed-data.js — load supplier profile/products from JSON when API is offline
 */
(function (ShopSupplier) {
  'use strict';

  const OFFLINE_SEED_VERSION = 'legacy-catalog-v4';

  const hasRole = (user, role) =>
    (user.roles || []).some((r) => String(r).toLowerCase() === String(role).toLowerCase());

  const seedFromOfflineJson = async () => {
    const loader = window.SimpleShopOfflineData;
    if (!loader) return null;

    const data = ShopSupplier.storage.getData();
    if (data.offlineSeedVersion === OFFLINE_SEED_VERSION && data.seeded) {
      return data;
    }

    const [users, productsPayload] = await Promise.all([
      loader.loadUsers(),
      loader.loadProducts()
    ]);

    const suppliers = (users.items || []).filter((u) => hasRole(u, 'Supplier'));
    const supplier = suppliers[0];
    if (!supplier) return null;

    const supplierId = supplier.id;
    const supplierProducts = (productsPayload.items || [])
      .filter((p) => String(p.supplierId) === String(supplierId) || suppliers.length === 1)
      .slice(0, 50);

    const brandNames = [...new Set(supplierProducts.map((p) => p.brandName).filter(Boolean))];
    const brands = brandNames.map((name, i) => ({
      id: `brand_${i + 1}`,
      name,
      description: name,
      createdAt: new Date().toISOString()
    }));
    const brandByName = new Map(brands.map((b) => [b.name, b]));

    const products = supplierProducts.map((p) => {
      const brand = brandByName.get(p.brandName);
      return {
        id: String(p.id),
        name: p.name || 'محصول',
        brandId: brand?.id || null,
        brandName: p.brandName || brand?.name || '',
        price: Number(p.price) || 0,
        stock: Number(p.stock) || 0,
        lowStockThreshold: 5,
        isActive: p.isActive !== false,
        description: p.description || '',
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.createdAt || new Date().toISOString()
      };
    });

    ShopSupplier.storage.saveData({
      seeded: true,
      offlineSeedVersion: OFFLINE_SEED_VERSION,
      profile: {
        id: supplier.id,
        companyName: `${supplier.firstName || ''} ${supplier.lastName || ''}`.trim() || 'تأمین‌کننده',
        contactPerson: `${supplier.firstName || ''} ${supplier.lastName || ''}`.trim(),
        username: supplier.userName || supplier.phoneNumber || '',
        email: supplier.email || '',
        phone: supplier.phoneNumber || '',
        mobile: supplier.phoneNumber || '',
        address: supplier.address || '',
        description: '',
        website: '',
        createdAt: supplier.registerDate || new Date().toISOString(),
        updatedAt: supplier.registerDate || new Date().toISOString()
      },
      brands,
      products
    });

    return ShopSupplier.storage.getData();
  };

  const seedIfApiOffline = async () => {
    if (await window.SimpleShopOfflineData?.isApiOnline?.(ShopSupplier.config?.API_BASE_URL)) {
      return null;
    }
    try {
      return await seedFromOfflineJson();
    } catch {
      return null;
    }
  };

  ShopSupplier.seed = { seedFromOfflineJson, seedIfApiOffline };
})(window.ShopSupplier = window.ShopSupplier || {});
