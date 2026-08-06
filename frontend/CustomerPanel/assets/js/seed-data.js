/**
 * seed-data.js — داده دمو پنل مشتری
 */
(function (ShopCustomer) {
  'use strict';

  const buildDemoWorkspace = () => {
    const now = Date.now();
    const daysAgo = (d) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

    const profile = {
      id: 'cust_demo',
      username: 'customer',
      firstName: 'سارا',
      lastName: 'احمدی',
      email: 'customer@simpleshop.ir',
      mobile: '09121234567',
      phone: '021-88776655',
      nationalId: '0012345678',
      postalCode: '1512345678',
      address: 'تهران، خیابان ولیعصر، پلاک ۱۲۰، واحد ۴',
      createdAt: daysAgo(120),
      updatedAt: daysAgo(2)
    };

    const financial = {
      bankName: 'بانک ملت',
      accountHolder: 'سارا احمدی',
      cardNumber: '6104337812345678',
      sheba: 'IR120170000000123456789001',
      updatedAt: daysAgo(10)
    };

    const orders = [
      {
        id: 'ord_1001',
        orderNumber: 'SS-1405-1001',
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'online',
        subtotal: 23700000,
        shippingCost: 85000,
        discount: 200000,
        total: 23585000,
        items: [
          { productId: 'p1', name: 'گوشی Galaxy A55', qty: 1, price: 18500000 },
          { productId: 'p2', name: 'هدفون Galaxy Buds', qty: 1, price: 5200000 }
        ],
        shippingAddress: profile.address,
        recipientName: 'سارا احمدی',
        recipientMobile: profile.mobile,
        createdAt: daysAgo(18),
        updatedAt: daysAgo(12)
      },
      {
        id: 'ord_1002',
        orderNumber: 'SS-1405-1002',
        status: 'shipping',
        paymentStatus: 'paid',
        paymentMethod: 'online',
        subtotal: 6900000,
        shippingCost: 65000,
        discount: 0,
        total: 6965000,
        items: [
          { productId: 'p3', name: 'ساعت هوشمند Xiaomi', qty: 1, price: 6900000 }
        ],
        shippingAddress: profile.address,
        recipientName: 'سارا احمدی',
        recipientMobile: profile.mobile,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(1)
      },
      {
        id: 'ord_1003',
        orderNumber: 'SS-1405-1003',
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: 'online',
        subtotal: 12500000,
        shippingCost: 0,
        discount: 0,
        total: 12500000,
        items: [
          { productId: 'p4', name: 'جاروبرقی ال‌جی', qty: 1, price: 12500000 }
        ],
        shippingAddress: profile.address,
        recipientName: 'سارا احمدی',
        recipientMobile: profile.mobile,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1)
      }
    ];

    const carts = [
      {
        id: 'cart_open_1',
        title: 'سبد خرید جاری',
        status: 'open',
        items: [
          { productId: 'p5', name: 'کیبورد مکانیکال', qty: 1, price: 3200000 },
          { productId: 'p6', name: 'ماوس بی‌سیم', qty: 2, price: 850000 }
        ],
        createdAt: daysAgo(3),
        updatedAt: daysAgo(0.2)
      },
      {
        id: 'cart_open_2',
        title: 'سبد ذخیره‌شده — لوازم خانه',
        status: 'abandoned',
        items: [
          { productId: 'p7', name: 'کتری برقی', qty: 1, price: 2100000 }
        ],
        createdAt: daysAgo(14),
        updatedAt: daysAgo(9)
      },
      {
        id: 'cart_empty_1',
        title: 'سبد خالی',
        status: 'empty',
        items: [],
        createdAt: daysAgo(20),
        updatedAt: daysAgo(20)
      }
    ];

    return { profile, financial, orders, carts };
  };

  const applyDemoWorkspace = () => {
    const data = ShopCustomer.storage.getData();
    const demo = buildDemoWorkspace();
    ShopCustomer.storage.saveData({
      ...data,
      ...demo,
      accounts: data.accounts || [],
      seeded: true
    });
    return ShopCustomer.storage.getData();
  };

  const seedDemoData = () => {
    const data = ShopCustomer.storage.getData();
    if (data.seeded && data.profile?.username === 'customer') return data;
    if (data.seeded && data.profile) return data;
    return applyDemoWorkspace();
  };

  ShopCustomer.seed = { seedDemoData, applyDemoWorkspace };
})(window.ShopCustomer = window.ShopCustomer || {});
