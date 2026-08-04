# VisitorPanel

Customer storefront for SimpleShop (formerly StorefrontPreview).

## Pages

- `index.html` — home
- `product.html?id=` — product detail
- `cart.html` / `checkout.html`
- `category.html` / `search.html`
- `login.html` — demo login UI

## API sync

`js/config.js` → `API_BASE_URL`  
`js/api-client.js` → fetch helpers  
`js/store-core.js` → loads `/api/products` + `/api/categories` when API is up, otherwise uses demo catalog.

## Offer tags

Bold **orange/red** labels for پیشنهاد شگفت‌انگیز, پیشنهاد ویژه, فروش ویژه.
