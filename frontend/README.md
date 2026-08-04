# SimpleShop Frontend

Static frontend layer (no bundler): **HTML + CSS + Bootstrap 5 + vanilla ECMAScript**.

## Panels

| Folder | Purpose | Entry |
|--------|---------|--------|
| `VisitorPanel/` | Customer shopping UI | `VisitorPanel/index.html` |
| `AdminPanel/` | Store admin (offline demo) | `AdminPanel/login.html` |
| `SupplierPanel/` | Supplier portal (offline demo) | `SupplierPanel/login.html` |

## VisitorPanel ↔ API

1. Start the API (`../api` → `dotnet run`).
2. Open `VisitorPanel/index.html` with Live Server.
3. Confirm `VisitorPanel/js/config.js` points at your API, e.g. `http://localhost:5102`.

## Design system

Cobalt palette shared across panels. Visitor offer tags use bold orange/red for **پیشنهاد شگفت‌انگیز** and sales.
