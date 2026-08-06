/**
 * Shared header / mega-nav / footer for visitor store pages
 */
(function (Store) {
  'use strict';

  const headerHTML = () => `
  <div class="preview-banner">
    فروشگاه آزمایشی SimpleShop — کارت خرید و صفحات محصول فعال است
  </div>
  <div class="top-bar">
    <div class="container-xxl d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div class="d-flex align-items-center gap-3 flex-wrap top-bar-links">
        <a href="index.html"><i class="bi bi-geo-alt"></i> ارسال به تهران</a>
        <a href="#"><i class="bi bi-headset"></i> پشتیبانی</a>
        <a href="#"><i class="bi bi-shop-window"></i> فروشنده شوید</a>
      </div>
      <div class="d-flex align-items-center gap-3 flex-wrap top-bar-links">
        <a href="login.html"><i class="bi bi-box-arrow-in-left"></i> ورود / ثبت‌نام</a>
        <a href="card.html"><i class="bi bi-truck"></i> پیگیری سفارش</a>
      </div>
    </div>
  </div>
  <header class="main-header">
    <div class="container-xxl">
      <div class="header-row">
        <a href="index.html" class="brand" data-store-brand>
          <span class="brand-mark" data-brand-mark><i class="bi bi-bag-heart-fill"></i></span>
          <span class="brand-text">
            <strong data-brand-name>SimpleShop</strong>
            <small data-brand-tagline>فروشگاه اینترنتی</small>
          </span>
        </a>
        <form class="search-box" role="search" data-store-search>
          <i class="bi bi-search"></i>
          <input type="search" name="q" placeholder="جستجو در محصولات، برندها و دسته‌ها..." aria-label="جستجو">
          <button type="submit" class="btn-search">جستجو</button>
        </form>
        <div class="header-actions">
          <a href="category.html?id=digital" class="action-btn" title="دسته‌ها"><i class="bi bi-grid"></i></a>
          <a href="card.html" class="action-btn cart-btn" title="کارت خرید">
            <i class="bi bi-credit-card-2-front"></i>
            <span class="cart-badge" data-card-count data-cart-count>0</span>
            <span class="cart-meta d-none d-lg-inline">
              <small>کارت خرید</small>
              <strong data-card-total data-cart-total>۰ ت</strong>
            </span>
          </a>
        </div>
      </div>
    </div>
  </header>
  <nav class="mega-nav">
    <div class="container-xxl">
      <ul class="mega-nav-list">
        <li class="mega-item">
          <a href="category.html" class="mega-trigger"><i class="bi bi-grid"></i> دسته‌بندی کالاها <i class="bi bi-chevron-down"></i></a>
          <div class="mega-panel">
            <div class="mega-cols">
              <div class="mega-col categories">
                <a class="mega-cat active" href="category.html?id=digital" data-panel="digital"><i class="bi bi-phone"></i> کالای دیجیتال</a>
                <a class="mega-cat" href="category.html?id=home" data-panel="home"><i class="bi bi-house"></i> خانه و آشپزخانه</a>
                <a class="mega-cat" href="category.html?id=fashion" data-panel="fashion"><i class="bi bi-handbag"></i> مد و پوشاک</a>
                <a class="mega-cat" href="category.html?id=beauty" data-panel="beauty"><i class="bi bi-flower1"></i> زیبایی و سلامت</a>
                <a class="mega-cat" href="category.html?id=sport" data-panel="sport"><i class="bi bi-trophy"></i> ورزش و سفر</a>
                <a class="mega-cat" href="category.html?id=gaming" data-panel="gaming"><i class="bi bi-controller"></i> گیمینگ</a>
              </div>
              <div class="mega-col links" id="mega-panel-digital">
                <h6>پیشنهادها</h6>
                <a href="category.html?id=digital">همه کالای دیجیتال</a>
                <a href="search.html?q=گوشی">گوشی موبایل</a>
                <a href="search.html?q=لپ‌تاپ">لپ‌تاپ</a>
                <a href="search.html?q=هدفون">هدفون</a>
              </div>
              <div class="mega-col links d-none" id="mega-panel-home">
                <h6>خانه</h6>
                <a href="category.html?id=home">همه خانه و آشپزخانه</a>
                <a href="search.html?q=قهوه">قهوه‌ساز</a>
                <a href="search.html?q=جارو">جارو رباتیک</a>
              </div>
              <div class="mega-col links d-none" id="mega-panel-fashion">
                <h6>مد</h6>
                <a href="category.html?id=fashion">همه مد و پوشاک</a>
                <a href="search.html?q=مانتو">مانتو</a>
                <a href="search.html?q=کفش">کفش ورزشی</a>
              </div>
              <div class="mega-col links d-none" id="mega-panel-beauty">
                <h6>زیبایی</h6>
                <a href="category.html?id=beauty">همه زیبایی و سلامت</a>
                <a href="search.html?q=عطر">عطر</a>
                <a href="search.html?q=کرم">مراقبت پوست</a>
              </div>
              <div class="mega-col links d-none" id="mega-panel-sport">
                <h6>ورزش</h6>
                <a href="category.html?id=sport">همه ورزش و سفر</a>
              </div>
              <div class="mega-col links d-none" id="mega-panel-gaming">
                <h6>گیمینگ</h6>
                <a href="category.html?id=gaming">همه گیمینگ</a>
                <a href="search.html?q=کنسول">کنسول بازی</a>
              </div>
              <div class="mega-col promo">
                <div class="mega-promo-card">
                  <span class="offer-tag tag-amazing">پیشنهاد شگفت‌انگیز</span>
                  <strong>تا ۴۰٪ تخفیف کالای دیجیتال</strong>
                  <a href="category.html?tag=amazing">مشاهده همه</a>
                </div>
              </div>
            </div>
          </div>
        </li>
        <li><a href="category.html?tag=amazing" class="nav-amazing"><i class="bi bi-lightning-charge-fill"></i> شگفت‌انگیزها</a></li>
        <li><a href="category.html">پرفروش‌ترین‌ها</a></li>
        <li><a href="category.html?tag=sale" class="nav-sale">تخفیف‌ها</a></li>
        <li><a href="login.html">حساب کاربری</a></li>
        <li class="ms-auto d-none d-xl-block"><a href="category.html?tag=special" class="mega-highlight"><i class="bi bi-gift"></i> پیشنهاد ویژه</a></li>
      </ul>
    </div>
  </nav>`;

  const footerHTML = () => `
  <footer class="site-footer">
    <div class="container-xxl">
      <div class="footer-top">
        <div class="footer-brand">
          <div class="brand" data-store-brand>
            <span class="brand-mark" data-brand-mark><i class="bi bi-bag-heart-fill"></i></span>
            <span class="brand-text">
              <strong data-brand-name>SimpleShop</strong>
              <small data-brand-tagline>خرید مطمئن، ارسال سریع</small>
            </span>
          </div>
          <p data-brand-desc>فروشگاه اینترنتی SimpleShop با تمرکز روی تجربه کاربری حرفه‌ای، قیمت شفاف و پشتیبانی واقعی.</p>
          <div class="socials">
            <a href="#" aria-label="اینستاگرام"><i class="bi bi-instagram"></i></a>
            <a href="#" aria-label="تلگرام"><i class="bi bi-telegram"></i></a>
            <a href="#" aria-label="یوتیوب"><i class="bi bi-youtube"></i></a>
          </div>
        </div>
        <div>
          <h5>با SimpleShop</h5>
          <a href="index.html">صفحه اصلی</a>
          <a href="category.html">محصولات</a>
          <a href="login.html">ورود</a>
          <a href="card.html">کارت خرید</a>
        </div>
        <div>
          <h5>خدمات مشتریان</h5>
          <a href="#">پرسش‌های متداول</a>
          <a href="#">بازگشت کالا</a>
          <a href="#">شرایط استفاده</a>
        </div>
        <div>
          <h5>دسته‌ها</h5>
          <a href="category.html?id=digital">کالای دیجیتال</a>
          <a href="category.html?id=home">خانه و آشپزخانه</a>
          <a href="category.html?id=beauty">زیبایی</a>
        </div>
        <div class="footer-contact">
          <h5>ارتباط با ما</h5>
          <p><i class="bi bi-telephone"></i> ۰۲۱-۹۱۰۰۰۰۰۰</p>
          <p><i class="bi bi-envelope"></i> support@simpleshop.ir</p>
          <p><i class="bi bi-geo-alt"></i> تهران، خیابان مثال، پلاک ۱۲</p>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ۱۴۰۴ SimpleShop — همه حقوق محفوظ است</span>
        <span class="preview-note">Visitor UI preview</span>
      </div>
    </div>
  </footer>`;

  const PUBLIC_BRANDING_KEY = 'simpleShopPublicBranding';

  const readBranding = () => {
    try {
      return JSON.parse(localStorage.getItem(PUBLIC_BRANDING_KEY) || 'null');
    } catch {
      return null;
    }
  };

  const applyBranding = () => {
    const branding = readBranding();
    if (!branding) return;

    const name = (branding.shopName || '').trim();
    const desc = (branding.shopDescription || '').trim();
    const logo = branding.logoDataUrl;

    document.querySelectorAll('[data-brand-name]').forEach((el) => {
      if (name) el.textContent = name;
    });

    document.querySelectorAll('[data-brand-desc]').forEach((el) => {
      if (desc) el.textContent = desc;
    });

    document.querySelectorAll('[data-brand-mark]').forEach((mark) => {
      if (logo) {
        mark.classList.add('has-logo');
        mark.innerHTML = `<img src="${logo}" alt="${name || 'لوگو'}" class="brand-logo-img">`;
      } else {
        mark.classList.remove('has-logo');
        mark.innerHTML = '<i class="bi bi-bag-heart-fill"></i>';
      }
    });
  };

  const mount = () => {
    const headerHost = document.getElementById('store-header');
    const footerHost = document.getElementById('store-footer');
    if (headerHost) headerHost.innerHTML = headerHTML();
    if (footerHost) footerHost.innerHTML = footerHTML();
    applyBranding();
    Store.card?.updateCardUI?.();
  };

  // Mount as soon as hosts exist (scripts are at end of body)
  mount();
  Store.layout = { mount, applyBranding };
})(window.SimpleStore = window.SimpleStore || {});
