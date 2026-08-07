# VisitorPanel

Customer storefront for SimpleShop.

## Pages

- `index.html` — home
- `product.html?id=` — product detail
- `card.html` — virtual shopping card (replaces legacy `cart.html` redirect)
- `checkout.html` — guest or logged-in checkout
- `category.html` / `search.html` — browse and search
- `auth.html` — login / register (Admin-style UI)
- `login.html` — redirect stub to `auth.html?tab=login`

## API sync

`js/config.js` → `API_BASE_URL`  
`js/api-client.js` → fetch helpers  
`js/store-core.js` → loads `/api/products` + `/api/categories` when API is up, otherwise uses demo catalog.

## Auth handoff

Visitor login/register saves:
- `simpleShopVisitorToken` for storefront API calls
- `shopCustomerSession` or `shopSupplierSession` for panel redirect after auth

## Offer tags

Bold **orange/red** labels for پیشنهاد شگفت‌انگیز, پیشنهاد ویژه, فروش ویژه.
