/**
 * seed-data.js — load customer accounts/orders from JSON when API is offline
 */
(function (ShopCustomer) {
  'use strict';

  const OFFLINE_SEED_VERSION = 'legacy-catalog-v1';

  const hasRole = (user, role) =>
    (user.roles || []).some((r) => String(r).toLowerCase() === String(role).toLowerCase());

  const mapOrder = (o) => ({
    id: `ord_${o.id}`,
    orderNumber: `SS-${o.id}`,
    status: o.status || 'pending',
    paymentStatus: String(o.paymentStatus || '').toLowerCase() === 'paid' ? 'paid' : 'unpaid',
    paymentMethod: 'online',
    subtotal: (o.items || []).reduce((sum, line) => sum + (Number(line.total) || 0), 0),
    shippingCost: 0,
    discount: 0,
    total: Number(o.totalAmount) || 0,
    items: (o.items || []).map((line) => ({
      productId: String(line.productId),
      name: line.productName || '',
      qty: line.quantity || 1,
      price: Number(line.unitPrice) || 0
    })),
    shippingAddress: o.shippingAddress || '',
    recipientName: '',
    recipientMobile: '',
    createdAt: o.orderDate || new Date().toISOString(),
    updatedAt: o.orderDate || new Date().toISOString()
  });

  const seedFromOfflineJson = async () => {
    const loader = window.SimpleShopOfflineData;
    if (!loader) return null;

    const data = ShopCustomer.storage.getData();
    if (data.offlineSeedVersion === OFFLINE_SEED_VERSION && (data.accounts?.length || 0) > 0) {
      return data;
    }

    const [users, orders] = await Promise.all([loader.loadUsers(), loader.loadOrders()]);
    const customers = (users.items || []).filter((u) => hasRole(u, 'Customer'));
    const allOrders = orders.items || [];

    const accounts = customers.map((u) => {
      const profile = {
        id: u.id,
        username: u.userName || u.phoneNumber || '',
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: u.email || '',
        mobile: u.phoneNumber || '',
        phone: u.phoneNumber || '',
        nationalId: '',
        postalCode: u.postalCode || '',
        address: u.address || '',
        createdAt: u.registerDate || new Date().toISOString(),
        updatedAt: u.registerDate || new Date().toISOString()
      };
      const userOrders = allOrders.filter((o) => o.userId === u.id).map(mapOrder);
      return {
        id: u.id,
        username: profile.username,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        mobile: profile.mobile,
        createdAt: profile.createdAt,
        profile,
        financial: {
          bankName: '',
          accountHolder: `${profile.firstName} ${profile.lastName}`.trim(),
          cardNumber: '',
          sheba: '',
          updatedAt: profile.createdAt
        },
        orders: userOrders,
        carts: []
      };
    });

    ShopCustomer.storage.saveData({
      ...data,
      accounts,
      offlineSeedVersion: OFFLINE_SEED_VERSION,
      seeded: true
    });
    return ShopCustomer.storage.getData();
  };

  const seedIfApiOffline = async () => {
    if (await window.SimpleShopOfflineData?.isApiOnline?.(ShopCustomer.config?.API_BASE_URL)) {
      return null;
    }
    try {
      return await seedFromOfflineJson();
    } catch {
      return null;
    }
  };

  ShopCustomer.seed = { seedFromOfflineJson, seedIfApiOffline };
})(window.ShopCustomer = window.ShopCustomer || {});
