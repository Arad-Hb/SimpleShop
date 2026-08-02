/**
 * seed-data.js — داده‌های نمونه فارسی برای اولین بارگذاری
 */
(function (ShopAdmin) {
  'use strict';

  const { STORAGE_KEY, saveData, recalculateProductRating } = ShopAdmin.storage;

  const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
  const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const seedDemoData = () => {
    if (localStorage.getItem(STORAGE_KEY)) return false;

    const categories = [
      { id: 1, name: 'لوازم خانگی', slug: 'لوازم-خانگی', description: 'وسایل برقی و غیربرقی منزل', isActive: true, sortOrder: 1, createdAt: daysAgo(90) },
      { id: 2, name: 'پوشاک', slug: 'پوشاک', description: 'لباس، کفش و اکسسوری', isActive: true, sortOrder: 2, createdAt: daysAgo(85) },
      { id: 3, name: 'لوازم دیجیتال', slug: 'لوازم-دیجیتال', description: 'موبایل، لپ‌تاپ و گجت', isActive: true, sortOrder: 3, createdAt: daysAgo(80) },
      { id: 4, name: 'آرایشی و بهداشتی', slug: 'آرایشی-بهداشتی', description: 'محصولات مراقبت پوست و مو', isActive: true, sortOrder: 4, createdAt: daysAgo(75) },
      { id: 5, name: 'کتاب و لوازم‌التحریر', slug: 'کتاب-لوازم-التحریر', description: 'کتاب، دفتر و نوشت‌افزار', isActive: true, sortOrder: 5, createdAt: daysAgo(70) },
      { id: 6, name: 'ورزش و سفر', slug: 'ورزش-سفر', description: 'تجهیزات ورزشی و کمپینگ', isActive: true, sortOrder: 6, createdAt: daysAgo(65) },
      { id: 7, name: 'مواد غذایی', slug: 'مواد-غذایی', description: 'خشکبار، چای و ادویه', isActive: false, sortOrder: 7, createdAt: daysAgo(60) }
    ];

    const suppliers = [
      { id: 1, name: 'شرکت پارس الکترونیک', contactPerson: 'رضا محمدی', phone: '02188776655', mobile: '09121234567', email: 'info@parselectronic.ir', address: 'تهران، میدان ونک', isActive: true, createdAt: daysAgo(100) },
      { id: 2, name: 'پوشاک آرتا', contactPerson: 'مریم حسینی', phone: '02144556677', mobile: '09129876543', email: 'sales@artawear.com', address: 'تهران، بازار بزرگ', isActive: true, createdAt: daysAgo(95) },
      { id: 3, name: 'دیجیتال نوین', contactPerson: 'علی کریمی', phone: '02133445566', mobile: '09351234567', email: 'support@digitnovin.ir', address: 'اصفهان، خیابان چهارباغ', isActive: true, createdAt: daysAgo(90) },
      { id: 4, name: 'زیبایی سپهر', contactPerson: 'سارا رضایی', phone: '02155667788', mobile: '09131112233', email: 'hello@sepehrbeauty.ir', address: 'شیراز، بلوار زند', isActive: true, createdAt: daysAgo(85) },
      { id: 5, name: 'انتشارات دانش', contactPerson: 'حسین مرادی', phone: '02166778899', mobile: '09141234567', email: 'books@daneshpub.ir', address: 'تهران، انقلاب', isActive: true, createdAt: daysAgo(80) },
      { id: 6, name: 'ورزش پیک', contactPerson: 'امیر نوری', phone: '02177889900', mobile: '09151234567', email: 'info@sportpeak.ir', address: 'مشهد، بلوار سجاد', isActive: false, createdAt: daysAgo(75) }
    ];

    const products = [
      { id: 1, name: 'جاروبرقی سامسونگ VC20', slug: 'جاروبرقی-سامسونگ-vc20', sku: 'HH-001', categoryId: 1, supplierId: 1, price: 8500000, discountPrice: 7990000, stock: 25, minimumStock: 5, isActive: true, description: 'جاروبرقی ۲۰۰۰ واتی با فیلتر HEPA', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(60) },
      { id: 2, name: 'ماشین لباسشویی ال‌جی ۸ کیلو', slug: 'ماشین-لباسشویی-ال-جی-8', sku: 'HH-002', categoryId: 1, supplierId: 1, price: 32000000, discountPrice: null, stock: 8, minimumStock: 3, isActive: true, description: 'مدل FM2 با موتور اینverter', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(58) },
      { id: 3, name: 'کت مردانه کتان', slug: 'کت-مردانه-کتان', sku: 'CL-001', categoryId: 2, supplierId: 2, price: 2450000, discountPrice: 1990000, stock: 45, minimumStock: 10, isActive: true, description: 'کت اسپرت مردانه، رنگ سرمه‌ای', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(55) },
      { id: 4, name: 'کفش ورزشی نایک ایرمکس', slug: 'کفش-ورزشی-نایک', sku: 'CL-002', categoryId: 2, supplierId: 2, price: 5800000, discountPrice: null, stock: 3, minimumStock: 5, isActive: true, description: 'سایز ۴۰ تا ۴۵', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(52) },
      { id: 5, name: 'گوشی سامسونگ Galaxy A55', slug: 'گوشی-سامسونگ-a55', sku: 'DG-001', categoryId: 3, supplierId: 3, price: 18500000, discountPrice: 17200000, stock: 18, minimumStock: 5, isActive: true, description: 'رم ۸ گیگ، حافظه ۲۵۶ گیگ', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(50) },
      { id: 6, name: 'لپ‌تاپ ایسوس Vivobook 15', slug: 'لپ-تاپ-ایسوس-vivobook', sku: 'DG-002', categoryId: 3, supplierId: 3, price: 28500000, discountPrice: null, stock: 0, minimumStock: 2, isActive: true, description: 'Core i5، ۱۶GB RAM', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(48) },
      { id: 7, name: 'هدفون بلوتوثی Sony WH-1000', slug: 'هدفون-سونی-wh1000', sku: 'DG-003', categoryId: 3, supplierId: 3, price: 12500000, discountPrice: 10900000, stock: 12, minimumStock: 4, isActive: true, description: 'نویزکنسلینگ فعال', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(45) },
      { id: 8, name: 'کرم آبرسان نیوآ', slug: 'کرم-آبرسان-نیوآ', sku: 'BT-001', categoryId: 4, supplierId: 4, price: 385000, discountPrice: null, stock: 60, minimumStock: 15, isActive: true, description: 'مناسب پوست خشک، ۵۰ml', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(42) },
      { id: 9, name: 'رژ لب مات میبلین', slug: 'رژ-لب-میبلین', sku: 'BT-002', categoryId: 4, supplierId: 4, price: 420000, discountPrice: 350000, stock: 2, minimumStock: 8, isActive: true, description: 'رنگ قرمز کلاسیک', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(40) },
      { id: 10, name: 'کتاب «شازده کوچولو»', slug: 'کتاب-شازده-کوچولو', sku: 'BK-001', categoryId: 5, supplierId: 5, price: 185000, discountPrice: null, stock: 100, minimumStock: 20, isActive: true, description: 'ترجمه احمد شاملو', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(38) },
      { id: 11, name: 'دفتر ۱۰۰ برگ سیمی', slug: 'دفتر-100-برگ', sku: 'BK-002', categoryId: 5, supplierId: 5, price: 65000, discountPrice: null, stock: 200, minimumStock: 50, isActive: true, description: 'کاغذ تحریر ۸۰ گرم', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(35) },
      { id: 12, name: 'دمبل ۵ کیلویی جفت', slug: 'دمبل-5-کیلویی', sku: 'SP-001', categoryId: 6, supplierId: 6, price: 890000, discountPrice: 750000, stock: 15, minimumStock: 5, isActive: true, description: 'روکش لاستیکی ضد لغزش', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(32) },
      { id: 13, name: 'چادر مسافرتی ۴ نفره', slug: 'چادر-مسافرتی-4-نفره', sku: 'SP-002', categoryId: 6, supplierId: 6, price: 3200000, discountPrice: null, stock: 0, minimumStock: 3, isActive: true, description: 'ضد آب، وزن ۳.۵ کیلو', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(30) },
      { id: 14, name: 'پنکه رومیزی تفال', slug: 'پنکه-رومیزی-تفال', sku: 'HH-003', categoryId: 1, supplierId: 1, price: 1250000, discountPrice: null, stock: 6, minimumStock: 10, isActive: true, description: 'سه سرعته، کنترل از راه دور', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(28) },
      { id: 15, name: 'ساعت هوشمند شیائومی Band 8', slug: 'ساعت-شیائومی-band8', sku: 'DG-004', categoryId: 3, supplierId: 3, price: 2100000, discountPrice: 1850000, stock: 30, minimumStock: 8, isActive: true, description: 'ضد آب IP68', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(25) },
      { id: 16, name: 'شامپو تقویتی سیتریل', slug: 'شامپو-سیتریل', sku: 'BT-003', categoryId: 4, supplierId: 4, price: 295000, discountPrice: null, stock: 40, minimumStock: 10, isActive: false, description: 'مناسب موهای آسیب‌دیده', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(22) },
      { id: 17, name: 'پسته اکبری ۱ کیلو', slug: 'پسته-اکبری-1-کیلو', sku: 'FD-001', categoryId: 7, supplierId: 1, price: 980000, discountPrice: null, stock: 50, minimumStock: 10, isActive: false, description: 'درجه یک رفسنجان', imageId: null, rating: 0, reviewCount: 0, createdAt: daysAgo(20) }
    ];

    const customers = [
      { id: 1, firstName: 'محمد', lastName: 'احمدی', email: 'm.ahmadi@gmail.com', mobile: '09121111111', nationalId: '0012345678', username: 'm.ahmadi', phone: '02188776655', postalCode: '1998712345', address: 'تهران، سعادت‌آباد، پلاک ۱۲', isActive: true, createdAt: daysAgo(80), lastLogin: daysAgo(1), updatedAt: daysAgo(1) },
      { id: 2, firstName: 'فاطمه', lastName: 'رضایی', email: 'f.rezaei@yahoo.com', mobile: '09122222222', nationalId: '0023456789', username: 'f.rezaei', phone: '03133445566', postalCode: '8145678901', address: 'اصفهان، خیابان آمادگاه', isActive: true, createdAt: daysAgo(75), lastLogin: daysAgo(3), updatedAt: daysAgo(3) },
      { id: 3, firstName: 'علی', lastName: 'کریمی', email: 'ali.karimi@outlook.com', mobile: '09123333333', nationalId: '0034567890', username: 'ali.karimi', phone: '07132345678', postalCode: '7185678901', address: 'شیراز، معالی‌آباد', isActive: true, createdAt: daysAgo(70), lastLogin: daysAgo(2), updatedAt: daysAgo(2) },
      { id: 4, firstName: 'زهرا', lastName: 'موسوی', email: 'z.mousavi@gmail.com', mobile: '09124444444', nationalId: '0045678901', username: 'z.mousavi', phone: '05138765432', postalCode: '9175678901', address: 'مشهد، احمدآباد', isActive: true, createdAt: daysAgo(65), lastLogin: daysAgo(5), updatedAt: daysAgo(5) },
      { id: 5, firstName: 'حسین', lastName: 'جعفری', email: 'h.jafari@mail.com', mobile: '09125555555', nationalId: '0056789012', username: 'h.jafari', phone: '04133445566', postalCode: '5135678901', address: 'تبریز، ولیعصر', isActive: true, createdAt: daysAgo(60), lastLogin: daysAgo(7), updatedAt: daysAgo(7) },
      { id: 6, firstName: 'مریم', lastName: 'نوری', email: 'maryam.n@gmail.com', mobile: '09126666666', nationalId: '0067890123', username: 'maryam.n', phone: '02633445566', postalCode: '3195678901', address: 'کرج، گوهردشت', isActive: true, createdAt: daysAgo(55), lastLogin: daysAgo(10), updatedAt: daysAgo(10) },
      { id: 7, firstName: 'رضا', lastName: 'صادقی', email: 'r.sadeghi@yahoo.com', mobile: '09127777777', nationalId: '0078901234', username: 'r.sadeghi', phone: '06133445566', postalCode: '6135678901', address: 'اهواز، کیانپارس', isActive: true, createdAt: daysAgo(50), lastLogin: daysAgo(4), updatedAt: daysAgo(4) },
      { id: 8, firstName: 'سارا', lastName: 'حسینی', email: 'sara.h@gmail.com', mobile: '09128888888', nationalId: '0089012345', username: 'sara.h', phone: '01333445566', postalCode: '4135678901', address: 'رشت، گلسار', isActive: true, createdAt: daysAgo(45), lastLogin: daysAgo(6), updatedAt: daysAgo(6) },
      { id: 9, firstName: 'امیر', lastName: 'محمدی', email: 'amir.m@outlook.com', mobile: '09129999999', nationalId: '0090123456', username: 'amir.m', phone: '02533445566', postalCode: '3715678901', address: 'قم، صفائیه', isActive: true, createdAt: daysAgo(40), lastLogin: daysAgo(2), updatedAt: daysAgo(2) },
      { id: 10, firstName: 'نرگس', lastName: 'اکبری', email: 'n.akbari@gmail.com', mobile: '09120000001', nationalId: '0101234567', username: 'n.akbari', phone: '03533445566', postalCode: '8915678901', address: 'یزد، صفائیه', isActive: true, createdAt: daysAgo(35), lastLogin: daysAgo(8), updatedAt: daysAgo(8) },
      { id: 11, firstName: 'پارسا', lastName: 'ملکی', email: 'parsa.m@gmail.com', mobile: '09120000002', nationalId: '0112345678', username: 'parsa.m', phone: '03433445566', postalCode: '7615678901', address: 'کرمان، بلوار جمهوری', isActive: false, createdAt: daysAgo(30), lastLogin: daysAgo(20), updatedAt: daysAgo(20) },
      { id: 12, firstName: 'لیلا', lastName: 'فرهادی', email: 'leila.f@yahoo.com', mobile: '09120000003', nationalId: '0123456780', username: 'leila.f', phone: '08133445566', postalCode: '6515678901', address: 'همدان، میدان امام', isActive: true, createdAt: daysAgo(25), lastLogin: daysAgo(1), updatedAt: daysAgo(1) }
    ];

    const mkOrderHistory = (status, at) => [{ status, at, by: 'system', note: 'ثبت سفارش' }];

    const orders = [
      { id: 1, orderNumber: 'ORD-1403-0001', customerId: 1, status: 'delivered', paymentStatus: 'paid', subtotal: 15840000, shippingCost: 45000, discount: 500000, total: 15385000, shippingAddress: 'تهران، سعادت‌آباد، پلاک ۱۲', recipientName: 'محمد احمدی', recipientMobile: '09121111111', postalCode: '1998712345', customerNote: '', adminNote: '', statusHistory: mkOrderHistory('delivered', daysAgo(45)), createdAt: daysAgo(45) },
      { id: 2, orderNumber: 'ORD-1403-0002', customerId: 2, status: 'shipped', paymentStatus: 'paid', subtotal: 5800000, shippingCost: 45000, discount: 0, total: 5845000, shippingAddress: 'اصفهان، خیابان آمادگاه', recipientName: 'فاطمه رضایی', recipientMobile: '09122222222', postalCode: '8145678901', customerNote: 'ارسال سریع', adminNote: '', statusHistory: mkOrderHistory('shipped', daysAgo(40)), createdAt: daysAgo(40) },
      { id: 3, orderNumber: 'ORD-1403-0003', customerId: 3, status: 'processing', paymentStatus: 'paid', subtotal: 18500000, shippingCost: 0, discount: 1300000, total: 17200000, shippingAddress: 'شیراز، معالی‌آباد', recipientName: 'علی کریمی', recipientMobile: '09123333333', postalCode: '7185678901', customerNote: '', adminNote: '', statusHistory: mkOrderHistory('processing', daysAgo(35)), createdAt: daysAgo(35) },
      { id: 4, orderNumber: 'ORD-1403-0004', customerId: 4, status: 'pending', paymentStatus: 'unpaid', subtotal: 770000, shippingCost: 45000, discount: 0, total: 815000, shippingAddress: 'مشهد، احمدآباد', recipientName: 'زهرا موسوی', recipientMobile: '09124444444', postalCode: '9175678901', customerNote: '', adminNote: '', statusHistory: mkOrderHistory('pending', daysAgo(30)), createdAt: daysAgo(30) },
      { id: 5, orderNumber: 'ORD-1403-0005', customerId: 5, status: 'delivered', paymentStatus: 'paid', subtotal: 12500000, shippingCost: 45000, discount: 1600000, total: 10945000, shippingAddress: 'تبریز، ولیعصر', recipientName: 'حسین جعفری', recipientMobile: '09125555555', postalCode: '5135678901', customerNote: '', adminNote: '', statusHistory: mkOrderHistory('delivered', daysAgo(28)), createdAt: daysAgo(28) },
      { id: 6, orderNumber: 'ORD-1403-0006', customerId: 6, status: 'cancelled', paymentStatus: 'refunded', subtotal: 32000000, shippingCost: 45000, discount: 0, total: 32045000, shippingAddress: 'کرج، گوهردشت', recipientName: 'مریم نوری', recipientMobile: '09126666666', postalCode: '3195678901', customerNote: 'لغو توسط مشتری', adminNote: 'مبلغ بازگردانده شد', statusHistory: mkOrderHistory('cancelled', daysAgo(25)), createdAt: daysAgo(25) },
      { id: 7, orderNumber: 'ORD-1403-0007', customerId: 7, status: 'delivered', paymentStatus: 'paid', subtotal: 2440000, shippingCost: 45000, discount: 460000, total: 2025000, shippingAddress: 'اهواز، کیانپارس', recipientName: 'رضا صادقی', recipientMobile: '09127777777', postalCode: '6135678901', customerNote: '', adminNote: '', statusHistory: mkOrderHistory('delivered', daysAgo(22)), createdAt: daysAgo(22) },
      { id: 8, orderNumber: 'ORD-1403-0008', customerId: 8, status: 'shipped', paymentStatus: 'paid', subtotal: 185000, shippingCost: 45000, discount: 0, total: 230000, shippingAddress: 'رشت، گلسار', recipientName: 'سارا حسینی', recipientMobile: '09128888888', postalCode: '4135678901', customerNote: '', adminNote: '', statusHistory: mkOrderHistory('shipped', daysAgo(20)), createdAt: daysAgo(20) },
      { id: 9, orderNumber: 'ORD-1403-0009', customerId: 9, status: 'processing', paymentStatus: 'paid', subtotal: 2100000, shippingCost: 45000, discount: 250000, total: 1895000, shippingAddress: 'قم، صفائیه', recipientName: 'امیر محمدی', recipientMobile: '09129999999', postalCode: '3715678901', customerNote: '', adminNote: '', statusHistory: mkOrderHistory('processing', daysAgo(18)), createdAt: daysAgo(18) },
      { id: 10, orderNumber: 'ORD-1403-0010', customerId: 10, status: 'delivered', paymentStatus: 'paid', subtotal: 890000, shippingCost: 45000, discount: 140000, total: 795000, shippingAddress: 'یزد، صفائیه', recipientName: 'نرگس اکبری', recipientMobile: '09120000001', postalCode: '8915678901', customerNote: '', adminNote: '', statusHistory: mkOrderHistory('delivered', daysAgo(15)), createdAt: daysAgo(15) },
      { id: 11, orderNumber: 'ORD-1403-0011', customerId: 1, status: 'pending', paymentStatus: 'unpaid', subtotal: 420000, shippingCost: 45000, discount: 70000, total: 395000, shippingAddress: 'تهران، سعادت‌آباد', recipientName: 'محمد احمدی', recipientMobile: '09121111111', postalCode: '1998712345', customerNote: '', adminNote: '', statusHistory: mkOrderHistory('pending', daysAgo(10)), createdAt: daysAgo(10) },
      { id: 12, orderNumber: 'ORD-1403-0012', customerId: 12, status: 'delivered', paymentStatus: 'paid', subtotal: 65000, shippingCost: 45000, discount: 0, total: 110000, shippingAddress: 'همدان، میدان امام', recipientName: 'لیلا فرهادی', recipientMobile: '09120000003', postalCode: '6515678901', customerNote: '', adminNote: '', statusHistory: mkOrderHistory('delivered', daysAgo(5)), createdAt: daysAgo(5) },
      { id: 13, orderNumber: 'ORD-1403-0013', customerId: 2, status: 'processing', paymentStatus: 'paid', subtotal: 7990000, shippingCost: 0, discount: 0, total: 7990000, shippingAddress: 'اصفهان، خیابان آمادگاه', recipientName: 'فاطمه رضایی', recipientMobile: '09122222222', postalCode: '8145678901', customerNote: 'ارسال رایگان', adminNote: '', statusHistory: mkOrderHistory('processing', daysAgo(3)), createdAt: daysAgo(3) }
    ];

    const orderItems = [
      { id: 1, orderId: 1, productId: 1, productName: 'جاروبرقی سامسونگ VC20', quantity: 1, unitPrice: 7990000, total: 7990000 },
      { id: 2, orderId: 1, productId: 3, productName: 'کت مردانه کتان', quantity: 2, unitPrice: 1990000, total: 3980000 },
      { id: 3, orderId: 1, productId: 8, productName: 'کرم آبرسان نیوآ', quantity: 1, unitPrice: 385000, total: 385000 },
      { id: 4, orderId: 1, productId: 10, productName: 'کتاب «شازده کوچولو»', quantity: 2, unitPrice: 185000, total: 370000 },
      { id: 5, orderId: 2, productId: 4, productName: 'کفش ورزشی نایک ایرمکس', quantity: 1, unitPrice: 5800000, total: 5800000 },
      { id: 6, orderId: 3, productId: 5, productName: 'گوشی سامسونگ Galaxy A55', quantity: 1, unitPrice: 17200000, total: 17200000 },
      { id: 7, orderId: 4, productId: 9, productName: 'رژ لب مات میبلین', quantity: 1, unitPrice: 350000, total: 350000 },
      { id: 8, orderId: 4, productId: 11, productName: 'دفتر ۱۰۰ برگ سیمی', quantity: 5, unitPrice: 65000, total: 325000 },
      { id: 9, orderId: 4, productId: 8, productName: 'کرم آبرسان نیوآ', quantity: 1, unitPrice: 385000, total: 385000 },
      { id: 10, orderId: 5, productId: 7, productName: 'هدفون بلوتوثی Sony WH-1000', quantity: 1, unitPrice: 10900000, total: 10900000 },
      { id: 11, orderId: 6, productId: 2, productName: 'ماشین لباسشویی ال‌جی ۸ کیلو', quantity: 1, unitPrice: 32000000, total: 32000000 },
      { id: 12, orderId: 7, productId: 3, productName: 'کت مردانه کتان', quantity: 1, unitPrice: 1990000, total: 1990000 },
      { id: 13, orderId: 7, productId: 12, productName: 'دمبل ۵ کیلویی جفت', quantity: 1, unitPrice: 750000, total: 750000 },
      { id: 14, orderId: 8, productId: 10, productName: 'کتاب «شازده کوچولو»', quantity: 1, unitPrice: 185000, total: 185000 },
      { id: 15, orderId: 9, productId: 15, productName: 'ساعت هوشمند شیائومی Band 8', quantity: 1, unitPrice: 1850000, total: 1850000 },
      { id: 16, orderId: 10, productId: 12, productName: 'دمبل ۵ کیلویی جفت', quantity: 1, unitPrice: 750000, total: 750000 },
      { id: 17, orderId: 10, productId: 11, productName: 'دفتر ۱۰۰ برگ سیمی', quantity: 1, unitPrice: 65000, total: 65000 },
      { id: 18, orderId: 11, productId: 9, productName: 'رژ لب مات میبلین', quantity: 1, unitPrice: 350000, total: 350000 },
      { id: 19, orderId: 12, productId: 11, productName: 'دفتر ۱۰۰ برگ سیمی', quantity: 1, unitPrice: 65000, total: 65000 },
      { id: 20, orderId: 13, productId: 1, productName: 'جاروبرقی سامسونگ VC20', quantity: 1, unitPrice: 7990000, total: 7990000 },
      { id: 21, orderId: 5, productId: 15, productName: 'ساعت هوشمند شیائومی Band 8', quantity: 1, unitPrice: 1850000, total: 1850000 },
      { id: 22, orderId: 3, productId: 7, productName: 'هدفون بلوتوثی Sony WH-1000', quantity: 1, unitPrice: 10900000, total: 10900000 }
    ];

    const carts = [
      { id: 1, customerId: 1, items: [{ productId: 5, quantity: 1 }, { productId: 8, quantity: 2 }], updatedAt: daysAgo(1), status: 'active' },
      { id: 2, customerId: 3, items: [{ productId: 15, quantity: 1 }], updatedAt: daysAgo(2), status: 'active' },
      { id: 3, customerId: 4, items: [{ productId: 3, quantity: 1 }, { productId: 4, quantity: 1 }], updatedAt: daysAgo(3), status: 'abandoned' },
      { id: 4, customerId: 6, items: [{ productId: 2, quantity: 1 }], updatedAt: daysAgo(4), status: 'abandoned' },
      { id: 5, customerId: 8, items: [{ productId: 10, quantity: 3 }, { productId: 11, quantity: 5 }], updatedAt: daysAgo(5), status: 'active' },
      { id: 6, customerId: 9, items: [{ productId: 7, quantity: 1 }], updatedAt: daysAgo(6), status: 'converted' },
      { id: 7, customerId: 10, items: [{ productId: 12, quantity: 2 }], updatedAt: daysAgo(7), status: 'active' },
      { id: 8, customerId: 12, items: [{ productId: 1, quantity: 1 }, { productId: 14, quantity: 1 }], updatedAt: daysAgo(0), status: 'active' },
      { id: 9, customerId: 2, items: [{ productId: 5, quantity: 1 }, { productId: 15, quantity: 1 }], updatedAt: daysAgo(1), status: 'active' },
      { id: 10, customerId: 11, items: [], updatedAt: daysAgo(14), status: 'abandoned' }
    ];

    const reviews = [
      { id: 1, productId: 1, customerId: 1, rating: 5, title: 'عالی', body: 'جاروبرقی بسیار قوی و بی‌صدا', status: 'approved', createdAt: daysAgo(40) },
      { id: 2, productId: 1, customerId: 5, rating: 4, title: 'خوب', body: 'کیفیت ساخت مناسب، کمی سنگین است', status: 'approved', createdAt: daysAgo(35) },
      { id: 3, productId: 3, customerId: 2, rating: 5, title: 'راضی', body: 'جنس پارچه عالی و دوخت تمیز', status: 'approved', createdAt: daysAgo(30) },
      { id: 4, productId: 5, customerId: 3, rating: 4, title: 'گوشی خوب', body: 'باتری خوب، دوربین متوسط', status: 'approved', createdAt: daysAgo(28) },
      { id: 5, productId: 5, customerId: 9, rating: 3, title: 'متوسط', body: 'قیمت نسبت به رقبا بالاست', status: 'pending', createdAt: daysAgo(15) },
      { id: 6, productId: 7, customerId: 5, rating: 5, title: 'بهترین هدفون', body: 'نویزکنسلینگ فوق‌العاده', status: 'approved', createdAt: daysAgo(25) },
      { id: 7, productId: 4, customerId: 2, rating: 2, title: 'سایز کوچک', body: 'سایزبندی با جدول سایت مطابقت نداشت', status: 'rejected', createdAt: daysAgo(20) },
      { id: 8, productId: 8, customerId: 4, rating: 5, title: 'آبرسان خوب', body: 'پوستم نرم شده', status: 'approved', createdAt: daysAgo(18) },
      { id: 9, productId: 10, customerId: 8, rating: 5, title: 'کتاب کلاسیک', body: 'چاپ باکیفیت و ترجمه روان', status: 'approved', createdAt: daysAgo(16) },
      { id: 10, productId: 12, customerId: 7, rating: 4, title: 'دمبل محکم', body: 'روکش لاستیکی خوب', status: 'approved', createdAt: daysAgo(14) },
      { id: 11, productId: 15, customerId: 9, rating: 5, title: 'ساعت عالی', body: 'باتری یک هفته دوام می‌آورد', status: 'approved', createdAt: daysAgo(12) },
      { id: 12, productId: 9, customerId: 4, rating: 1, title: 'رنگ متفاوت', body: 'رنگ با عکس فرق داشت', status: 'pending', createdAt: daysAgo(10) },
      { id: 13, productId: 3, customerId: 7, rating: 3, title: 'معمولی', body: 'برای قیمتش قابل قبول است', status: 'pending', createdAt: daysAgo(8) },
      { id: 14, productId: 14, customerId: 1, rating: 4, title: 'پنکه خوب', body: 'صدای کم، باد مناسب', status: 'approved', createdAt: daysAgo(6) },
      { id: 15, productId: 6, customerId: 6, rating: 5, title: 'لپ‌تاپ عالی', body: 'سرعت بالا برای کار روزمره', status: 'rejected', createdAt: daysAgo(4) },
      { id: 16, productId: 11, customerId: 12, rating: 5, title: 'دفتر با کیفیت', body: 'کاغذ ضخیم و سیم محکم', status: 'approved', createdAt: daysAgo(3) },
      { id: 17, productId: 2, customerId: 6, rating: 4, title: 'لباسشویی خوب', body: 'برنامه‌های شستشو متنوع', status: 'pending', createdAt: daysAgo(2) }
    ];

    const data = {
      categories,
      suppliers,
      products,
      customers,
      carts,
      orders,
      orderItems,
      reviews,
      settings: {
        shopName: 'فروشگاه آنلاین ساده',
        shopDescription: 'فروشگاه اینترنتی لوازم خانگی، پوشاک و دیجیتال',
        currency: 'تومان',
        lowStockThreshold: 10,
        taxRate: 9,
        shippingCost: 45000,
        freeShippingMin: 500000,
        contactPhone: '02112345678',
        contactEmail: 'info@simpleshop.ir',
        address: 'تهران، خیابان ولیعصر، پلاک ۱۰۰',
        instagram: '@simpleshop_ir',
        telegram: '@simpleshop_support'
      },
      adminProfile: {
        fullName: 'مدیر فروشگاه',
        email: 'admin@simpleshop.local',
        mobile: '09121234567',
        avatarId: null,
        lastLogin: null
      },
      counters: {
        categories: 7,
        suppliers: 6,
        products: 17,
        customers: 12,
        carts: 10,
        orders: 13,
        orderItems: 22,
        reviews: 17
      }
    };

    saveData(data);

    // محاسبه امتیاز محصولات بر اساس نظرات تأییدشده
    const productIds = [...new Set(reviews.map((r) => r.productId))];
    productIds.forEach((pid) => recalculateProductRating(pid));

    return true;
  };

  ShopAdmin.seed = { seedDemoData };
})(window.ShopAdmin = window.ShopAdmin || {});
