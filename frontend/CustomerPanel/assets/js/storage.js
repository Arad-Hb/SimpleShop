/**
 * storage.js — LocalStorage برای پنل مشتری
 */
(function (ShopCustomer) {
  'use strict';

  const STORAGE_KEY = 'shopCustomerData';

  const defaultData = () => ({
    profile: null,
    financial: null,
    orders: [],
    carts: [],
    accounts: [],
    seeded: false
  });

  const getData = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      return { ...defaultData(), ...JSON.parse(raw) };
    } catch {
      return defaultData();
    }
  };

  const saveData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const update = (mutator) => {
    const data = getData();
    mutator(data);
    saveData(data);
    return data;
  };

  const getProfile = () => getData().profile;

  const saveProfile = (profile) => {
    const saved = update((data) => {
      data.profile = { ...data.profile, ...profile, updatedAt: new Date().toISOString() };
    }).profile;
    syncActiveAccountSnapshot();
    return saved;
  };

  const getFinancial = () => getData().financial || null;

  const saveFinancial = (financial) => {
    const saved = update((data) => {
      data.financial = { ...data.financial, ...financial, updatedAt: new Date().toISOString() };
    }).financial;
    syncActiveAccountSnapshot();
    return saved;
  };

  const getOrders = () => getData().orders || [];

  const getOrder = (id) => getOrders().find((o) => o.id === id) || null;

  const getCarts = () => getData().carts || [];

  const getCart = (id) => getCarts().find((c) => c.id === id) || null;

  const saveCart = (cart) => {
    update((data) => {
      const list = data.carts || [];
      const idx = list.findIndex((c) => c.id === cart.id);
      if (idx >= 0) list[idx] = cart;
      else list.push(cart);
      data.carts = list;
    });
    syncActiveAccountSnapshot();
  };

  const deleteCart = (id) => {
    update((data) => {
      data.carts = (data.carts || []).filter((c) => c.id !== id);
    });
    syncActiveAccountSnapshot();
  };

  const removeCartItem = (cartId, productId) => {
    let cart = null;
    update((data) => {
      const list = data.carts || [];
      const idx = list.findIndex((c) => c.id === cartId);
      if (idx < 0) return;
      const items = (list[idx].items || []).filter((i) => i.productId !== productId);
      if (!items.length) {
        list.splice(idx, 1);
        cart = null;
      } else {
        list[idx] = {
          ...list[idx],
          items,
          updatedAt: new Date().toISOString()
        };
        cart = list[idx];
      }
      data.carts = list;
    });
    syncActiveAccountSnapshot();
    return cart;
  };

  const getAccounts = () => getData().accounts || [];

  const findAccount = (username) => {
    const key = String(username || '').trim().toLowerCase();
    return getAccounts().find((a) => String(a.username || '').toLowerCase() === key) || null;
  };

  const syncActiveAccountSnapshot = () => {
    const profile = getProfile();
    const username = profile?.username;
    if (!username) return;
    update((data) => {
      const list = data.accounts || [];
      const idx = list.findIndex(
        (a) => String(a.username || '').toLowerCase() === String(username).toLowerCase()
      );
      if (idx < 0) return;
      list[idx] = {
        ...list[idx],
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        mobile: profile.mobile,
        profile: data.profile,
        financial: data.financial,
        orders: data.orders || [],
        carts: data.carts || []
      };
      data.accounts = list;
    });
  };

  const activateAccount = (account) =>
    update((data) => {
      data.profile = account.profile || {
        id: account.id,
        username: account.username,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        mobile: account.mobile,
        phone: '',
        nationalId: '',
        postalCode: '',
        address: '',
        createdAt: account.createdAt,
        updatedAt: account.createdAt
      };
      data.financial = account.financial || {
        bankName: '',
        accountHolder: `${account.firstName || ''} ${account.lastName || ''}`.trim(),
        cardNumber: '',
        sheba: '',
        updatedAt: account.createdAt
      };
      data.orders = account.orders || [];
      data.carts = account.carts || [];
    });

  const registerAccount = (account) =>
    update((data) => {
      const profile = {
        id: account.id,
        username: account.username,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        mobile: account.mobile,
        phone: '',
        nationalId: '',
        postalCode: '',
        address: '',
        createdAt: account.createdAt,
        updatedAt: account.createdAt
      };
      const financial = {
        bankName: '',
        accountHolder: `${account.firstName} ${account.lastName}`.trim(),
        cardNumber: '',
        sheba: '',
        updatedAt: account.createdAt
      };
      data.accounts = data.accounts || [];
      data.accounts.push({
        ...account,
        profile,
        financial,
        orders: [],
        carts: []
      });
      data.profile = profile;
      data.financial = financial;
      data.orders = [];
      data.carts = [];
      data.seeded = true;
    });

  const stats = () => {
    const orders = getOrders();
    const carts = getCarts();
    const paid = orders.filter((o) => o.paymentStatus === 'paid');
    const pending = orders.filter((o) => o.paymentStatus !== 'paid');
    const totalSpent = paid.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const openCartItems = carts.reduce((s, c) => s + (c.items || []).length, 0);
    return {
      orderCount: orders.length,
      paidCount: paid.length,
      pendingCount: pending.length,
      totalSpent,
      openCarts: carts.length,
      openCartItems
    };
  };

  ShopCustomer.storage = {
    STORAGE_KEY,
    getData,
    saveData,
    getProfile,
    saveProfile,
    getFinancial,
    saveFinancial,
    getOrders,
    getOrder,
    getCarts,
    getCart,
    saveCart,
    deleteCart,
    removeCartItem,
    getAccounts,
    findAccount,
    registerAccount,
    activateAccount,
    syncActiveAccountSnapshot,
    stats
  };
})(window.ShopCustomer = window.ShopCustomer || {});
