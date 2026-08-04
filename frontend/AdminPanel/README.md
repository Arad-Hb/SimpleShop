# SimpleShop Admin Panel — پنل مدیریت فروشگاه

**Persian RTL offline admin panel** for the SimpleShop educational e-commerce project.  
**پنل مدیریت فارسی RTL** برای پروژه آموزشی فروشگاه اینترنتی SimpleShop.

This frontend runs **completely offline** using LocalStorage + IndexedDB. It is designed to be connected to the ASP.NET Core Web API backend in a later phase.

این فرانت‌اند **کاملاً آفلاین** با LocalStorage و IndexedDB اجرا می‌شود و در مرحله بعد به ASP.NET Core Web API متصل خواهد شد.

---

## Quick Start / اجرای سریع

### Option 1 — Open directly / باز کردن مستقیم

1. Open `login.html` in your browser (double-click or drag into Chrome/Edge/Firefox).
2. Log in with demo credentials (see below).

فایل `login.html` را مستقیماً در مرورگر باز کنید.

> **Note:** Some browsers restrict IndexedDB on `file://`. If image upload fails, use Live Server (Option 2).

### Option 2 — VS Code Live Server (recommended)

1. Install the **Live Server** extension in VS Code / Cursor.
2. Right-click `login.html` → **Open with Live Server**.
3. Browse to `http://127.0.0.1:5500/AdminPanel/login.html` (port may vary).

### Option 3 — Simple HTTP server

```bash
cd SimpleShop/AdminPanel
npx --yes serve .
# or: python -m http.server 8080
```

Then open `http://localhost:3000/login.html` (or port 8080).

---

## Demo Credentials / حساب دمو

| Field | Value |
|-------|-------|
| Username / نام کاربری | `admin` |
| Password / رمز عبور | `Admin@123` |

Authentication is **client-side only** for demo purposes. Passwords are **never stored** in LocalStorage.

احراز هویت فقط در سمت کلاینت است و رمز عبور در LocalStorage ذخیره **نمی‌شود**.

---

## Security Notes / نکات امنیتی

| Topic | Offline Demo | Production (ASP.NET Core) |
|-------|--------------|---------------------------|
| Auth | Hardcoded demo user in `auth.js` | JWT + server-side validation |
| Password | Not persisted locally | BCrypt hash in database |
| Data | LocalStorage (user's browser) | SQL Server via API |
| Session | sessionStorage / localStorage token | HttpOnly cookie or Bearer JWT |
| File upload | IndexedDB blobs (local only) | Server storage + validation |

**Do not use this demo auth pattern in production.**

این الگوی احراز هویت دمو فقط برای آموزش است و در محیط واقعی استفاده نشود.

---

## File Structure / ساختار فایل‌ها

```
AdminPanel/
├── login.html              # Login page / صفحه ورود
├── index.html              # Dashboard / داشبورد
├── categories.html         # Categories CRUD
├── suppliers.html          # Suppliers CRUD
├── products.html           # Products CRUD
├── product-gallery.html    # Product image gallery
├── customers.html          # Customers list
├── carts.html              # Shopping carts
├── orders.html             # Orders management
├── reviews.html            # Reviews moderation
├── reports.html            # Sales & analytics reports
├── settings.html           # Shop settings
├── profile.html            # Admin profile
├── 404.html                # Not found page
├── README.md               # This file
└── assets/
    ├── css/
    │   ├── bootstrap.rtl.min.css
    │   ├── bootstrap-icons.min.css
    │   └── admin.css
    ├── vendor/
    │   └── bootstrap.bundle.min.js
    └── js/
        ├── storage.js      # LocalStorage + IndexedDB repositories
        ├── seed-data.js    # Demo data seeder
        ├── utils.js        # Helpers (formatPrice, badges, …)
        ├── validation.js   # Form validation
        ├── pagination.js   # Pagination & sorting
        ├── ui.js           # Sidebar, toast, modals, …
        ├── auth.js         # Demo authentication
        ├── app.js          # App bootstrap
        ├── login.js
        ├── dashboard.js
        ├── reviews.js
        ├── reports.js
        ├── settings.js
        └── profile.js
```

---

## Data Storage / ذخیره‌سازی داده

| Store | Key / Name | Contents |
|-------|------------|----------|
| LocalStorage | `shopAdminData` | Categories, products, orders, reviews, settings, … |
| LocalStorage | `shopAdminSession` | Session (if "Remember me" checked) |
| sessionStorage | `shopAdminSession` | Active session |
| IndexedDB | `ShopAdminImages` | Image blobs (logo, avatar, product images) |

**Reset demo data:** Settings → Danger Zone → Reset Demo Data  
**بازنشانی دمو:** تنظیمات → بازنشانی داده‌های دمو

---

## Pages Overview / معرفی صفحات

| Page | Description |
|------|-------------|
| `reviews.html` | Review list, filters, bulk approve/reject, detail modal. Recalculates product rating on status change. |
| `reports.html` | Stats cards, top products/customers, sales chart, review stats, CSV export, print. |
| `settings.html` | Shop name, logo/favicon/OG upload, contact, SEO defaults, visibility, demo reset. |
| `profile.html` | Admin name, email, mobile, avatar upload. Password section is display-only. |
| `404.html` | Styled not-found page with link to dashboard. |

---

## API Endpoint Mapping (Future Integration)

When connecting to ASP.NET Core Web API, map admin panel operations as follows:

| Admin Panel Feature | HTTP | ASP.NET Core Route |
|---------------------|------|---------------------|
| Login | POST | `/api/auth/login` |
| Logout | — | Client-side only (remove JWT) |
| Categories CRUD | GET/POST/PUT/DELETE | `/api/categories` |
| Suppliers CRUD | GET/POST/PUT/DELETE | `/api/suppliers` |
| Products CRUD | GET/POST/PUT/DELETE | `/api/products` |
| Product images | POST multipart | `/api/products/{id}/images` *(future)* |
| Customers list | GET | `/api/customers` |
| Orders list/detail | GET/POST/PUT | `/api/orders` |
| Carts | GET/POST/PUT/DELETE | `/api/cart` |
| Reviews list/approve | GET/PUT | `/api/reviews` *(future)* |
| Reports summary | GET | `/api/reports/summary` |
| Shop settings | GET/PUT | `/api/settings` *(future)* |
| Admin profile | GET/PUT | `/api/auth/profile` *(future)* |

### Integration steps / مراحل اتصال

1. Replace `ShopAdmin.storage.createRepository()` calls with `fetch()` to API endpoints.
2. Add JWT from `/api/auth/login` to `Authorization: Bearer` header.
3. Map DTO field names (PascalCase API ↔ camelCase JS).
4. Move image upload from IndexedDB to server file storage.
5. Remove `seed-data.js` seeding in production builds.

---

## Script Load Order

Admin pages load scripts in this order (no ES modules — works on `file://`):

```html
<script src="assets/vendor/bootstrap.bundle.min.js"></script>
<script src="assets/js/storage.js"></script>
<script src="assets/js/utils.js"></script>
<script src="assets/js/validation.js"></script>
<script src="assets/js/pagination.js"></script>
<script src="assets/js/ui.js"></script>
<script src="assets/js/auth.js"></script>
<script src="assets/js/seed-data.js"></script>
<script src="assets/js/app.js"></script>
<script src="assets/js/PAGE.js"></script>
```

---

## Review Entity Schema

```javascript
{
  id, productId, customerId,
  rating: 1-5,
  title, body,
  status: 'pending' | 'approved' | 'rejected',
  rejectReason, adminNote,
  reviewedAt, reviewerName,
  createdAt
}
```

Product `rating` and `reviewCount` are recalculated via `ShopAdmin.storage.recalculateProductRating(productId)` when reviews are approved, rejected, or deleted.

---

## Tech Stack / فناوری‌ها

- HTML5 (semantic, RTL)
- CSS3 + Bootstrap 5 RTL (local, no CDN)
- Bootstrap Icons (local)
- Vanilla JavaScript (IIFE on `window.ShopAdmin`, ES2022)
- LocalStorage + IndexedDB

---

## License / مجوز

Educational project — SimpleShop © 2026

پروژه آموزشی — برای استفاده در کلاس و یادگیری ASP.NET Core
