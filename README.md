# SimpleShop — educational layered shop

Beginner-friendly full-stack shop for teaching, modeled after AdvertisePlaceMarket-v1.

Students can trace one operation from an HTML button to SQL Server:

HTML page → page JavaScript → Axios → Controller → Service → Repository → EF Core → SQL Server

This is **not** Clean Architecture and not a production enterprise system. It is a Course-1 layered monolith.

## Projects

```
SimpleShop/
  api/Framework/         OperationResult, pagination, constants, helpers
  api/DomainModel/       Entities, ViewModels, EF configurations, DbContext
  api/DataAccess/        Feature repositories, mappers, services
  api/SimpleShop.Api/    Controllers, JWT, FileManager, seeder, Swagger
  frontend/              VisitorPanel, CustomerPanel, AdminPanel, shared JS
  tests/                 Beginner unit and hygiene tests
```

Dependencies: DomainModel → Framework; DataAccess → DomainModel + Framework; Api → DataAccess + DomainModel + Framework; Frontend → HTTP API.

There is no generic repository, CQRS, MediatR, AutoMapper, FluentValidation, or C# enums.

## Prerequisites

- .NET 10 SDK
- SQL Server (local instance `Server=.` is the educational default)
- A static file server for `frontend/` (Live Server / any static host)

## Configuration (educational)

Connection string, JWT signing key, and seed passwords live in `api/SimpleShop.Api/appsettings.json`.

These values are **development-only**. Do not use them in production.

Default seeded users:

| Role | Mobile | Password |
|------|--------|----------|
| Admin | 09120000001 | Admin@123456 |
| Customer | 09120000002 | Customer@123456 |
| Customer | 09120000003 | Demo@123456 |

Database name: `SimpleShopEducationalDb`  
Created with `EnsureCreated` (teaching shortcut, not migrations).

CORS policy `Frontend` allows any origin in this course.

## Run

```bash
dotnet restore SimpleShop.slnx
dotnet build SimpleShop.slnx
dotnet run --project api/SimpleShop.Api/SimpleShop.Api.csproj
```

API: `http://localhost:5102`  
Swagger (Development): `http://localhost:5102/swagger`

Open `frontend/VisitorPanel/index.html` with Live Server.

## Features in this course

- Visitor catalog, cart (local product id + quantity), login/register, checkout
- Customer orders and profile
- Admin categories, products (one image), customers, orders, settings, reports
- Checkout requires a Customer JWT
- Order statuses: pending → processing → shipped → delivered, plus cancelled

Removed on purpose: Supplier, banners, product gallery, reviews, saved carts, financial module, guest checkout, offline JSON.

## Teaching boundaries

- `EnsureCreated` instead of EF migrations
- Permissive CORS
- JWT key in Development settings
- Local file storage and thumbnail generation
- Simulated store catalog from the seeder (no live `.bak` import in this recovery)

## Publish

```bash
dotnet publish api/SimpleShop.Api/SimpleShop.Api.csproj -c Release -o ./publish
```

Do not copy project DLLs by hand. Do not commit `bin`, `obj`, DLL, PDB, or publish output.

## Tests

```bash
dotnet test SimpleShop.slnx
```

## Smoke checklist (run locally)

1. Start the API, then open Visitor `index.html` with Live Server.
2. Register a new customer (or log in as `09120000002` / `Customer@123456`).
3. Add a product to the cart; checkout requires the Customer JWT.
4. Confirm a second checkout cannot oversell remaining stock.
5. Customer can cancel a `pending` order and stock returns.
6. Admin (`09120000001` / `Admin@123456`) can CRUD categories and products (one image), edit customers, change order status, save settings/hero, and open reports.
7. Customer JWT cannot call `/api/admin/...`; Admin JWT cannot checkout.
