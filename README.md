# SimpleShop - فروشگاه اینترنتی ساده

پروژه آموزشی فروشگاه اینترنتی با **ASP.NET Core Web API**، **EF Core Code First**، **SQL Server** و **JavaScript**.

## امکانات

- مدیریت دسته‌بندی‌ها، محصولات، تأمین‌کنندگان، مشتریان و سفارش‌ها (پنل مدیر)
- نمایش، جست‌وجو، فیلتر و مرتب‌سازی محصولات
- سبد خرید و ثبت سفارش با کنترل موجودی
- احراز هویت JWT (مدیر / مشتری)
- گزارش‌های ساده: تعداد سفارش، مجموع فروش، محصولات کم‌موجود

## پیش‌نیازها

- [.NET 10 SDK](https://dotnet.microsoft.com/download) (یا .NET 8+)
- SQL Server یا LocalDB

## اجرا

```bash
cd SimpleShop/SimpleShop
dotnet ef migrations add InitialCreate
dotnet run
```

مرورگر: `https://localhost:7xxx` یا `http://localhost:5xxx`

## حساب‌های آزمایشی

| نقش | نام کاربری | رمز عبور |
|-----|------------|----------|
| مدیر | admin | Admin123! |
| مشتری | customer | Customer123! |

## ساختار پروژه

```
SimpleShop/
├── Controllers/     # Web API
├── Data/            # DbContext, Seeder
├── Models/
│   ├── Entities/    # Category, Product, Order, ...
│   └── DTOs/
├── Services/        # Business logic
└── wwwroot/         # Frontend (HTML/CSS/JS)
    └── admin/       # پنل مدیریت
```

## Connection String

در `appsettings.json`:

```json
"DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=SimpleShopDb;Trusted_Connection=True;TrustServerCertificate=True;"
```

## API Endpoints

| Method | Route | توضیح |
|--------|-------|-------|
| POST | /api/auth/login | ورود |
| POST | /api/auth/register | ثبت‌نام مشتری |
| GET | /api/products | لیست محصولات (فیلتر/جست‌وجو) |
| GET/POST/PUT/DELETE | /api/categories | CRUD دسته‌بندی |
| GET/POST/PUT/DELETE | /api/suppliers | CRUD تأمین‌کننده (Admin) |
| GET/POST/PUT/DELETE | /api/products | CRUD محصول (Admin) |
| GET | /api/customers | لیست مشتریان (Admin) |
| GET/POST/PUT/DELETE | /api/cart | سبد خرید (Customer) |
| GET/POST | /api/orders | سفارش‌ها |
| GET | /api/reports/summary | گزارش (Admin) |

## نکات آموزشی

- **مدرس در کلاس:** محصولات، تأمین‌کنندگان، سفارش
- **دانشجو:** دسته‌بندی‌ها، مشتریان، گزارش‌ها (الگوی مشابه)

## انتشار

```bash
dotnet publish -c Release -o ./publish
```

خروجی `publish` را روی IIS، Azure App Service یا هر هاست .NET قرار دهید.
