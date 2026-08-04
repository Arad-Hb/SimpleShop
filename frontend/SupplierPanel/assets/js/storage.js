/**
 * storage.js — LocalStorage برای پنل تأمین‌کننده
 */
(function (ShopSupplier) {
  'use strict';

  const STORAGE_KEY = 'shopSupplierData';

  const defaultData = () => ({
    profile: null,
    brands: [],
    products: [],
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

  const saveProfile = (profile) =>
    update((data) => {
      data.profile = { ...data.profile, ...profile, updatedAt: new Date().toISOString() };
    }).profile;

  const getBrands = () => getData().brands || [];

  const saveBrand = (brand) =>
    update((data) => {
      const list = data.brands || [];
      const idx = list.findIndex((b) => b.id === brand.id);
      if (idx >= 0) list[idx] = brand;
      else list.push(brand);
      data.brands = list;
    });

  const deleteBrand = (id) =>
    update((data) => {
      data.brands = (data.brands || []).filter((b) => b.id !== id);
      data.products = (data.products || []).map((p) =>
        p.brandId === id ? { ...p, brandId: null, brandName: '' } : p
      );
    });

  const getProducts = () => getData().products || [];

  const getProduct = (id) => getProducts().find((p) => p.id === id) || null;

  const saveProduct = (product) =>
    update((data) => {
      const list = data.products || [];
      const idx = list.findIndex((p) => p.id === product.id);
      if (idx >= 0) list[idx] = product;
      else list.push(product);
      data.products = list;
    });

  const deleteProduct = (id) =>
    update((data) => {
      data.products = (data.products || []).filter((p) => p.id !== id);
    });

  const adjustStock = (productId, delta) => {
    let updated = null;
    update((data) => {
      const p = (data.products || []).find((x) => x.id === productId);
      if (!p) return;
      p.stock = Math.max(0, (Number(p.stock) || 0) + delta);
      p.updatedAt = new Date().toISOString();
      updated = p;
    });
    return updated;
  };

  const stats = () => {
    const products = getProducts();
    const brands = getBrands();
    const totalStock = products.reduce((s, p) => s + (Number(p.stock) || 0), 0);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)).length;
    const outOfStock = products.filter((p) => !p.stock || p.stock <= 0).length;
    const active = products.filter((p) => p.isActive !== false).length;
    return {
      productCount: products.length,
      activeCount: active,
      brandCount: brands.length,
      totalStock,
      lowStock,
      outOfStock
    };
  };

  ShopSupplier.storage = {
    STORAGE_KEY,
    getData,
    saveData,
    getProfile,
    saveProfile,
    getBrands,
    saveBrand,
    deleteBrand,
    getProducts,
    getProduct,
    saveProduct,
    deleteProduct,
    adjustStock,
    stats
  };
})(window.ShopSupplier = window.ShopSupplier || {});
