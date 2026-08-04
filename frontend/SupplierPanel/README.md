# SimpleShop Supplier Panel — پنل تأمین‌کننده

Offline supplier portal (HTML + CSS + Bootstrap 5 + vanilla JS) using the **Cobalt** palette shared with AdminPanel.

پنل آفلاین تأمین‌کننده با پالت Cobalt و ساختار مشابه پنل مدیریت.

## Quick start

1. Open `frontend/SupplierPanel/login.html` in the browser (or Live Server).
2. Bootstrap/CSS are loaded from `../AdminPanel/assets/` — keep both folders under `frontend/`.

## Demo login

| Field | Value |
|-------|-------|
| Username | `supplier` |
| Password | `Supplier@123` |

## Features

- Supplier profile (company, contact, address)
- Dashboard (product count, brands, stock, low/out of stock)
- Products CRUD + stock increase/decrease steppers
- Brands CRUD linked to products

Data is stored in LocalStorage (`shopSupplierData`). Auth is demo-only (no password persisted).

## Pages

- `login.html` — ورود
- `index.html` — داشبورد
- `products.html` — لیست محصولات و موجودی
- `product-form.html` — افزودن / ویرایش محصول
- `brands.html` — برندها
- `profile.html` — پروفایل تأمین‌کننده
