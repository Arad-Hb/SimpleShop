(function () {
  const panel = (function detectPanel() {
    const path = (location.pathname || "").replace(/\\/g, "/");
    if (path.includes("/AdminPanel/")) {
      return { name: "admin", visitor: "../VisitorPanel/", customer: "../CustomerPanel/", admin: "" };
    }
    if (path.includes("/CustomerPanel/")) {
      return { name: "customer", visitor: "../VisitorPanel/", customer: "", admin: "../AdminPanel/" };
    }
    return { name: "visitor", visitor: "", customer: "../CustomerPanel/", admin: "../AdminPanel/" };
  })();

  function pageUrl(path) {
    return String(path).replace(/^\//, "");
  }

  window.AppConfig = {
    panel,
    pageUrl,
    apiBaseUrl: "http://localhost:5102/api",
    mediaBaseUrl: "http://localhost:5102",
    siteName: "فروشگاه ساده تحلیل داده",
    tokenStorageKey: "simpleShop_access_token",
    userStorageKey: "simpleShop_current_user",
    cartStorageKey: "simpleShop_cart",
    sidebarStorageKey: "simpleShop_sidebar_collapsed",
    pageSize: 12,
    panelPageSize: 10,
    defaultProductImage: "../shared/assets/img/tahlildadeh-logo.png",
    defaultAvatar: "../shared/assets/img/tahlildadeh-logo.png",
    brandLogo: "../shared/assets/img/tahlildadeh-logo.png",
    endpoints: {
      storeHome: "/store/home",
      storeSettings: "/store/settings",
      categoryMenu: "/store/categories/menu",
      categoryDetails: (id) => `/store/categories/${id}`,
      categoryBySlug: (slug) => `/store/categories/by-slug/${encodeURIComponent(slug)}`,
      products: "/store/products",
      productDetails: (id) => `/store/products/${id}`,
      productBySlug: (slug) => `/store/products/by-slug/${encodeURIComponent(slug)}`,

      login: "/account/login",
      register: "/account/register",
      logout: "/account/logout",
      checkMobile: "/account/check-mobile",
      authenticatedUser: "/account/authenticated-user",
      profile: "/account/profile",
      changePassword: "/account/change-password",
      avatar: "/file-manager/account/avatar",

      customerOrders: "/customer/orders",
      customerOrder: (id) => `/customer/orders/${id}`,
      customerCancelOrder: (id) => `/customer/orders/${id}/cancel`,

      adminDashboard: "/admin/reports/dashboard",
      adminCategories: "/admin/categories",
      adminCategory: (id) => `/admin/categories/${id}`,
      adminProducts: "/admin/products",
      adminProduct: (id) => `/admin/products/${id}`,
      adminCustomers: "/admin/customers",
      adminCustomer: (id) => `/admin/customers/${encodeURIComponent(id)}`,
      adminActivateCustomer: (id) => `/admin/customers/${encodeURIComponent(id)}/activate`,
      adminDeactivateCustomer: (id) => `/admin/customers/${encodeURIComponent(id)}/deactivate`,
      adminOrders: "/admin/orders",
      adminOrder: (id) => `/admin/orders/${id}`,
      adminOrderStatus: (id) => `/admin/orders/${id}/status`,
      adminCancelOrder: (id) => `/admin/orders/${id}/cancel`,
      adminSettings: "/admin/settings",
      adminProductImage: (id) => `/file-manager/products/${id}/image`,
      adminCategoryImage: (id) => `/file-manager/categories/${id}/image`,
      adminLogo: "/file-manager/site/logo",
      adminFavicon: "/file-manager/site/favicon",
      adminHero: "/file-manager/site/hero"
    }
  };
})();
