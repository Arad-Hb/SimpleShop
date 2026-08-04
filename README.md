# SimpleShop

Educational e-commerce project split into **frontend** and a **layered teaching API**.

```
SimpleShop/
├── frontend/                 # All UI panels (HTML / CSS / Bootstrap 5 / JS)
│   ├── VisitorPanel/         # Customer storefront (JWT in localStorage)
│   ├── AdminPanel/           # Admin offline panel (LocalStorage + IndexedDB images)
│   └── SupplierPanel/        # Supplier portal (LocalStorage)
├── api/
│   ├── Framework/            # OperationResult, PageModel, base repo contracts
│   ├── DomainModel/          # Entities, DbContext, ViewModels, seeder, migrations
│   ├── DataAccess/           # Repository interfaces + implementations
│   └── SimpleShop.Api/       # Thin Web API host (JWT, CORS, controllers)
├── SimpleShop.slnx
└── README.md
```

Legacy duplicate trees (root AdminPanel / StorefrontPreview / flat `api` Controllers) were removed.

## Run the API

Default URL: `http://localhost:5102`  
Database: `SimpleShopLayeredDb` (migrated + seeded on startup)

### Visual Studio

1. Open **`SimpleShop.slnx`** (repo root).
2. In **Solution Explorer**, right-click **`SimpleShop.Api`** → **Set as Startup Project**.
3. In the toolbar profile dropdown, pick **`http`** (uses `http://localhost:5102`).
4. Press **F5** (debug) or **Ctrl+F5** (run without debugger).

On startup the API migrates the database and seeds data if needed.

**If it doesn’t start**

- Install the **.NET 10 SDK** (project targets `net10.0`).
- Make sure SQL Server is running locally (connection string uses `Server=.;...Trusted_Connection=True`).
- If port `5102` is busy, stop the other process or change the URL in `api/SimpleShop.Api/Properties/launchSettings.json`.

**Quick check:** open `http://localhost:5102/api/categories`

### Command line

```bash
cd api/SimpleShop.Api
dotnet run --launch-profile http
```

### Demo accounts (API)

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Admin123!` |
| Customer | `customer` / `customer02`… | `Customer123!` |
| Supplier user | `supplier01`…`supplier15` | `Supplier123!` |

Seed targets on API startup: **10 categories**, **100 products**, **100 users** (admin + customers + supplier users), plus **15** supplier companies.

## Run the frontend

Open any panel with Live Server (or a static file server). Keep `frontend/` as the web root when possible.

| Panel | Entry |
|-------|--------|
| Visitor store | `frontend/VisitorPanel/index.html` |
| Admin | `frontend/AdminPanel/login.html` |
| Supplier | `frontend/SupplierPanel/login.html` |

VisitorPanel talks to the API via `js/config.js` (`API_BASE_URL`).  
If the API is offline, it falls back to local demo catalog data.

## Sync status

- **VisitorPanel → API**: `/api/products`, `/api/categories`, `/api/auth/login`
- **Admin logo → VisitorPanel**: Settings → لوگوی فروشگاه writes `simpleShopPublicBranding` in localStorage (serve both panels from `frontend/` so they share origin)
- AdminPanel / SupplierPanel data: LocalStorage demos (product gallery, customer avatar, admin profile avatar)

## Notes

- No ASP.NET Identity — JWT + BCrypt only.
- Controllers call repositories; they never use `DbContext` directly.
- API CORS allows any origin so frontend can run on another port.
- SupplierPanel shares Bootstrap assets from `../AdminPanel/assets/`.
