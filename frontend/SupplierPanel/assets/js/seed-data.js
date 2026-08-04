/**
 * seed-data.js — داده‌های نمونه تأمین‌کننده
 */
(function (ShopSupplier) {
  'use strict';

  const seedDemoData = () => {
    const data = ShopSupplier.storage.getData();
    if (data.seeded) return;

    const now = new Date().toISOString();
    const brandA = { id: 'brand_samsung', name: 'Samsung', description: 'کالای دیجیتال سامسونگ', createdAt: now };
    const brandB = { id: 'brand_lg', name: 'LG', description: 'لوازم خانگی ال‌جی', createdAt: now };
    const brandC = { id: 'brand_xiaomi', name: 'Xiaomi', description: 'گجت و موبایل', createdAt: now };

    const products = [
      {
        id: 'prod_a55',
        name: 'گوشی Galaxy A55',
        brandId: brandA.id,
        brandName: brandA.name,
        sku: 'SM-A55-128',
        price: 18500000,
        stock: 24,
        lowStockThreshold: 5,
        isActive: true,
        description: 'گوشی هوشمند با حافظه ۱۲۸ گیگ',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod_buds',
        name: 'هدفون Galaxy Buds',
        brandId: brandA.id,
        brandName: brandA.name,
        sku: 'BUDS-3',
        price: 5200000,
        stock: 4,
        lowStockThreshold: 5,
        isActive: true,
        description: 'هدفون بی‌سیم',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod_tv',
        name: 'تلویزیون ۵۵ اینچ LG',
        brandId: brandB.id,
        brandName: brandB.name,
        sku: 'LG-55-4K',
        price: 32900000,
        stock: 8,
        lowStockThreshold: 3,
        isActive: true,
        description: 'تلویزیون هوشمند 4K',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod_mi',
        name: 'ساعت هوشمند Xiaomi',
        brandId: brandC.id,
        brandName: brandC.name,
        sku: 'MI-WATCH-S',
        price: 6900000,
        stock: 0,
        lowStockThreshold: 5,
        isActive: true,
        description: 'ساعت هوشمند',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod_washer',
        name: 'ماشین لباسشویی LG',
        brandId: brandB.id,
        brandName: brandB.name,
        sku: 'LG-WASH-8',
        price: 27800000,
        stock: 6,
        lowStockThreshold: 2,
        isActive: false,
        description: '۸ کیلویی اینورتر',
        createdAt: now,
        updatedAt: now
      }
    ];

    ShopSupplier.storage.saveData({
      seeded: true,
      profile: {
        id: 'sup_demo_1',
        companyName: 'تأمین‌کننده آریا تجارت',
        contactPerson: 'رضا محمدی',
        username: 'supplier',
        email: 'supplier@simpleshop.ir',
        phone: '021-91001234',
        mobile: '09121234567',
        address: 'تهران، خیابان ولیعصر، پلاک ۲۰۰',
        description: 'تأمین کالای دیجیتال و لوازم خانگی اصل با گارانتی معتبر.',
        website: 'https://example.com',
        createdAt: now,
        updatedAt: now
      },
      brands: [brandA, brandB, brandC],
      products
    });
  };

  ShopSupplier.seed = { seedDemoData };
})(window.ShopSupplier = window.ShopSupplier || {});
