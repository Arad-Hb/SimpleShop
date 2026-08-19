# SimpleShop API

ASP.NET Core educational API. See the root [README](../README.md) for architecture, seed users, and how to run.

Identity + JWT. Roles: `Admin`, `Customer`.

Route groups:

- `/api/store` public catalog
- `/api/account` login/register/profile
- `/api/customer` checkout and my orders
- `/api/admin/...` admin entity controllers
- `/api/file-manager` image uploads
