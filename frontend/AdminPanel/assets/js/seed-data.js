/**
 * seed-data.js — load shared JSON into LocalStorage when API is offline
 */
(function (ShopAdmin) {
  'use strict';

  const { saveData } = ShopAdmin.storage;
  const OFFLINE_SEED_VERSION = 'legacy-catalog-v1';
  const DEFAULT_SHOP_NAME = (window.SimpleShopSite && window.SimpleShopSite.name) || 'فروشگاه ساده تحلیل داده';

  const hasRole = (user, role) =>
    (user.roles || []).some((r) => String(r).toLowerCase() === String(role).toLowerCase());

  const mapCategory = (c) => ({
    id: c.id,
    name: c.name || '',
    slug: c.slug || `cat-${c.id}`,
    description: c.description || '',
    parentId: c.parentId ?? null,
    sortOrder: c.sortOrder ?? c.id,
    depth: c.depth ?? 0,
    isActive: c.isActive !== false,
    createdAt: c.createdAt || new Date().toISOString(),
    source: 'offline'
  });

  const mapProduct = (p) => ({
    id: p.id,
    name: p.name || 'محصول',
    slug: p.slug || `product-${p.id}`,
    sku: p.sku || `SKU-${String(p.id).padStart(4, '0')}`,
    categoryId: p.categoryId ?? null,
    categoryName: p.categoryName || '',
    supplierId: p.supplierId ?? null,
    supplierName: p.supplierName || '',
    price: Number(p.price) || 0,
    discountPrice: null,
    stock: Number(p.stock) || 0,
    minimumStock: 5,
    isActive: p.isActive !== false,
    description: p.description || '',
    imageId: null,
    rating: 0,
    reviewCount: 0,
    createdAt: p.createdAt || new Date().toISOString(),
    source: 'offline'
  });

  const mapCustomer = (u, index) => ({
    id: index + 1,
    userId: u.id,
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    email: u.email || '',
    mobile: u.phoneNumber || u.userName || '',
    nationalId: '',
    username: u.userName || u.phoneNumber || '',
    phone: u.phoneNumber || '',
    postalCode: u.postalCode || '',
    address: u.address || '',
    isActive: u.isActive !== false,
    createdAt: u.registerDate || new Date().toISOString(),
    lastLogin: null,
    updatedAt: u.registerDate || new Date().toISOString()
  });

  const normalizePaymentStatus = (value) => {
    const v = String(value || '').toLowerCase();
    if (v === 'paid') return 'paid';
    if (v === 'refunded') return 'refunded';
    return 'unpaid';
  };

  const mapOrders = (rawOrders, customers) => {
    const byUserId = new Map(customers.filter((c) => c.userId).map((c) => [c.userId, c]));
    const orders = [];
    const orderItems = [];

    (rawOrders || []).forEach((o) => {
      const customer = byUserId.get(o.userId);
      const createdAt = o.orderDate || new Date().toISOString();
      const subtotal = (o.items || []).reduce((sum, line) => sum + (Number(line.total) || 0), 0);
      const shippingCost = subtotal >= 500000 ? 0 : 45000;
      const total = Number(o.totalAmount) || subtotal + shippingCost;

      orders.push({
        id: o.id,
        orderNumber: `ORD-${String(o.id).padStart(6, '0')}`,
        customerId: customer?.id || 0,
        status: o.status || 'pending',
        paymentStatus: normalizePaymentStatus(o.paymentStatus),
        subtotal,
        shippingCost,
        discount: 0,
        total,
        shippingAddress: o.shippingAddress || customer?.address || '',
        recipientName: customer ? `${customer.firstName} ${customer.lastName}`.trim() : '',
        recipientMobile: customer?.mobile || '',
        postalCode: customer?.postalCode || '',
        customerNote: '',
        adminNote: '',
        statusHistory: [{ status: o.status || 'pending', at: createdAt, by: 'system', note: 'ثبت سفارش' }],
        createdAt
      });

      (o.items || []).forEach((line) => {
        orderItems.push({
          id: line.id,
          orderId: o.id,
          productId: line.productId,
          productName: line.productName || '',
          quantity: line.quantity || 1,
          unitPrice: Number(line.unitPrice) || 0,
          total: Number(line.total) || 0
        });
      });
    });

    return { orders, orderItems };
  };

  const deriveSuppliers = (products) => {
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
          source: 'offline'
        });
      }
    });
    return [...map.values()];
  };

  const seedFromOfflineJson = async () => {
    const loader = window.SimpleShopOfflineData;
    if (!loader) return { ok: false, message: 'offline loader missing' };

    try {
      const { categories, products, users, orders } = await loader.loadAll();
      const catItems = (categories.items || []).filter((c) => c.isActive !== false);
      const prodItems = (products.items || []).filter((p) => p.isActive !== false);
      if (!prodItems.length) return { ok: false, message: 'empty products' };

      const mappedProducts = prodItems.map(mapProduct);
      const mappedCategories = catItems.map(mapCategory);
      const mappedCustomers = (users.items || [])
        .filter((u) => hasRole(u, 'Customer'))
        .map(mapCustomer);
      const { orders: mappedOrders, orderItems } = mapOrders(orders.items || [], mappedCustomers);
      const suppliers = deriveSuppliers(mappedProducts);

      saveData({
        categories: mappedCategories,
        suppliers,
        products: mappedProducts,
        customers: mappedCustomers,
        carts: [],
        orders: mappedOrders,
        orderItems,
        reviews: [],
        settings: {
          shopName: DEFAULT_SHOP_NAME,
          shopDescription: 'فروشگاه اینترنتی آموزشی',
          currency: 'تومان',
          lowStockThreshold: 10,
          taxRate: 9,
          shippingCost: 45000,
          freeShippingMin: 500000,
          contactPhone: '02112345678',
          contactEmail: 'info@simpleshop.ir',
          address: 'تهران',
          shopVisibility: 'public'
        },
        adminProfile: {
          fullName: 'مدیر فروشگاه',
          email: 'admin@simpleshop.local',
          mobile: '09121234567',
          avatarId: null,
          lastLogin: null
        },
        counters: {
          categories: mappedCategories.length,
          suppliers: suppliers.length,
          products: mappedProducts.length,
          customers: mappedCustomers.length,
          carts: 0,
          orders: mappedOrders.length,
          orderItems: orderItems.length,
          reviews: 0
        },
        offlineSeedVersion: OFFLINE_SEED_VERSION,
        offlineSeededAt: new Date().toISOString()
      });

      return {
        ok: true,
        products: mappedProducts.length,
        categories: mappedCategories.length,
        customers: mappedCustomers.length,
        orders: mappedOrders.length
      };
    } catch (err) {
      return { ok: false, message: err?.message || 'offline seed failed' };
    }
  };

  /** Seed from JSON when API sync failed and no API catalog is cached */
  const seedIfApiOffline = async (syncResult = {}) => {
    const existing = ShopAdmin.storage.getData();
    if (existing.offlineSeedVersion === OFFLINE_SEED_VERSION && (existing.products?.length || 0) > 0) {
      return { ok: true, message: 'already seeded' };
    }
    if (existing.apiSyncVersion && (existing.products?.length || 0) > 0) {
      return { ok: false, message: 'api data present' };
    }
    if (syncResult.ok) {
      return { ok: false, message: 'api sync ok' };
    }
    return seedFromOfflineJson();
  };

  ShopAdmin.seed = { seedFromOfflineJson, seedIfApiOffline };
})(window.ShopAdmin = window.ShopAdmin || {});
