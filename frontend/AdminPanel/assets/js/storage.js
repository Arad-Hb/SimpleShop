/**
 * storage.js — لایه ذخیره‌سازی LocalStorage + IndexedDB
 * الگوی Repository برای موجودیت‌های فروشگاه
 */
(function (ShopAdmin) {
  'use strict';

  const STORAGE_KEY = 'shopAdminData';
  /** Shared with VisitorPanel (same browser origin under frontend/). */
  const PUBLIC_BRANDING_KEY = 'simpleShopPublicBranding';
  const DB_NAME = 'ShopAdminImages';
  const DB_VERSION = 1;
  const IMAGE_STORE = 'images';

  /** @type {IDBDatabase|null} */
  let db = null;

  const ENTITY_KEYS = [
    'categories', 'suppliers', 'products', 'customers',
    'carts', 'orders', 'orderItems', 'reviews',
    'settings', 'adminProfile', 'counters'
  ];

  const defaultData = () => ({
    categories: [],
    suppliers: [],
    products: [],
    customers: [],
    carts: [],
    orders: [],
    orderItems: [],
    reviews: [],
    settings: {
      shopName: 'فروشگاه من',
      currency: 'تومان',
      lowStockThreshold: 10,
      taxRate: 9,
      shippingCost: 45000,
      freeShippingMin: 500000
    },
    adminProfile: {
      fullName: 'مدیر سیستم',
      email: 'admin@shop.local',
      mobile: '09121234567',
      avatarId: null
    },
    counters: {
      categories: 0,
      suppliers: 0,
      products: 0,
      customers: 0,
      carts: 0,
      orders: 0,
      orderItems: 0,
      reviews: 0
    }
  });

  // ─── IndexedDB ───────────────────────────────────────────────

  const openImageDB = () => new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(IMAGE_STORE)) {
        database.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });

  const imageStore = {
    async saveImage(id, blob) {
      const database = await openImageDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(IMAGE_STORE, 'readwrite');
        tx.objectStore(IMAGE_STORE).put({ id, blob, updatedAt: Date.now() });
        tx.oncomplete = () => resolve(id);
        tx.onerror = () => reject(tx.error);
      });
    },

    async getImage(id) {
      const database = await openImageDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(IMAGE_STORE, 'readonly');
        const req = tx.objectStore(IMAGE_STORE).get(id);
        req.onsuccess = () => resolve(req.result?.blob ?? null);
        req.onerror = () => reject(req.error);
      });
    },

    async deleteImage(id) {
      const database = await openImageDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(IMAGE_STORE, 'readwrite');
        tx.objectStore(IMAGE_STORE).delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    }
  };

  // ─── LocalStorage ────────────────────────────────────────────

  const initStorage = () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData()));
    }
    return getData();
  };

  const getData = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : defaultData();
    } catch {
      return defaultData();
    }
  };

  const saveData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // ─── Repository ──────────────────────────────────────────────

  const nextId = (data, entityKey) => {
    const counterKey = entityKey === 'orderItems' ? 'orderItems' : entityKey;
    data.counters[counterKey] = (data.counters[counterKey] || 0) + 1;
    return data.counters[counterKey];
  };

  const createRepository = (entityKey) => {
    if (!ENTITY_KEYS.includes(entityKey)) {
      throw new Error(`موجودیت نامعتبر: ${entityKey}`);
    }

    const isArrayEntity = entityKey !== 'settings' && entityKey !== 'adminProfile' && entityKey !== 'counters';

    return {
      getAll() {
        const data = getData();
        return isArrayEntity ? [...(data[entityKey] || [])] : { ...data[entityKey] };
      },

      getById(id) {
        const data = getData();
        if (!isArrayEntity) return data[entityKey];
        return (data[entityKey] || []).find((item) => item.id === id) ?? null;
      },

      create(item) {
        const data = getData();
        if (!isArrayEntity) {
          data[entityKey] = { ...data[entityKey], ...item };
          saveData(data);
          return data[entityKey];
        }
        const newItem = {
          ...item,
          id: item.id ?? nextId(data, entityKey),
          createdAt: item.createdAt ?? new Date().toISOString()
        };
        data[entityKey].push(newItem);
        saveData(data);
        return newItem;
      },

      update(id, updates) {
        const data = getData();
        if (!isArrayEntity) {
          data[entityKey] = { ...data[entityKey], ...updates };
          saveData(data);
          return data[entityKey];
        }
        const index = (data[entityKey] || []).findIndex((item) => item.id === id);
        if (index === -1) return null;
        data[entityKey][index] = {
          ...data[entityKey][index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        saveData(data);
        return data[entityKey][index];
      },

      remove(id) {
        const data = getData();
        if (!isArrayEntity) return false;
        const before = (data[entityKey] || []).length;
        data[entityKey] = (data[entityKey] || []).filter((item) => item.id !== id);
        const removed = data[entityKey].length < before;
        if (removed) saveData(data);
        return removed;
      }
    };
  };

  // ─── Business helpers ────────────────────────────────────────

  /** محاسبه مجدد امتیاز محصول بر اساس نظرات تأییدشده */
  const recalculateProductRating = (productId) => {
    const data = getData();
    const approved = (data.reviews || []).filter(
      (r) => r.productId === productId && r.status === 'approved'
    );
    const product = (data.products || []).find((p) => p.id === productId);
    if (!product) return null;

    if (approved.length === 0) {
      product.rating = 0;
      product.reviewCount = 0;
    } else {
      const sum = approved.reduce((acc, r) => acc + (r.rating || 0), 0);
      product.rating = Math.round((sum / approved.length) * 10) / 10;
      product.reviewCount = approved.length;
    }

    saveData(data);
    return product;
  };

  /**
   * وضعیت موجودی: available | low | out
   * @param {{ stock: number, minimumStock?: number, isActive?: boolean }} product
   */
  const getProductStockStatus = (product) => {
    if (!product || product.isActive === false) return 'inactive';
    const stock = Number(product.stock) || 0;
    const minimum = Number(product.minimumStock) ?? 5;
    if (stock <= 0) return 'out';
    if (stock <= minimum) return 'low';
    return 'available';
  };

  const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  /** Publish shop name + logo for VisitorPanel home/header. */
  const syncPublicBranding = async (settings = {}) => {
    const payload = {
      shopName: settings.shopName || 'SimpleShop',
      shopDescription: settings.shopDescription || '',
      logoDataUrl: null,
      updatedAt: Date.now()
    };
    if (settings.logoId) {
      const blob = await imageStore.getImage(settings.logoId);
      if (blob) payload.logoDataUrl = await blobToDataUrl(blob);
    }
    localStorage.setItem(PUBLIC_BRANDING_KEY, JSON.stringify(payload));
    return payload;
  };

  ShopAdmin.storage = {
    STORAGE_KEY,
    PUBLIC_BRANDING_KEY,
    initStorage,
    getData,
    saveData,
    createRepository,
    imageStore,
    syncPublicBranding,
    recalculateProductRating,
    getProductStockStatus,
    ENTITY_KEYS
  };
})(window.ShopAdmin = window.ShopAdmin || {});
