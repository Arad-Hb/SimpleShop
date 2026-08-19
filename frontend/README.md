# Frontend

Vanilla HTML, CSS, Bootstrap 5 RTL, Axios. No React/Vue/TypeScript bundler.

Shared scripts in `shared/js/`:

- `config.js` API host and endpoints
- `api.js` Axios + JWT interceptor
- `auth.js` login and roles
- `cart.js` local `{ productId, quantity }`
- `toast.js` Persian toasts
- `layout.js` visitor chrome
- `panel-layout.js` customer/admin chrome
- page scripts under `pages/`, `customer/`, `admin/`

Every catalog, order, and settings value comes from the API. Local storage keeps only JWT session, cart ids/qty, and UI prefs.
