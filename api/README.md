# SimpleShop API (layered teaching layout)

```
Framework → DomainModel → DataAccess → SimpleShop.Api
```

No ASP.NET Identity. JWT + BCrypt; controllers call repositories only.

## Run

```bash
cd api/SimpleShop.Api
dotnet run --launch-profile http
```

API: `http://localhost:5102`  
Database: `SimpleShopLayeredDb` (created/migrated on startup)

## Demo users

| User | Password | Role |
|------|----------|------|
| admin | Admin123! | Admin |
| customer | Customer123! | Customer |

## Main endpoints

| Method | Route | Notes |
|--------|-------|--------|
| POST | `/api/auth/login` | JWT → localStorage on VisitorPanel |
| POST | `/api/auth/register` | Customer + JWT |
| GET | `/api/products` | Public list (`items` via ProductListComplex) |
| GET | `/api/products/search` | Teaching Search (PageIndex) |
| GET | `/api/products/{id}` | Public detail |
| GET | `/api/categories` | Public |
| GET/POST | `/api/cart` | Customer JWT |
| GET/POST | `/api/orders` | Customer / Admin |

## Frontend

UI lives in `../frontend/` (VisitorPanel, AdminPanel, SupplierPanel).
