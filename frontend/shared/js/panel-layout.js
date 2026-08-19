window.PanelLayout = (function () {
  const cfg = window.AppConfig;

  const adminItems = [
    { id: "dashboard", label: "داشبورد", icon: "bi-speedometer2", href: "index.html" },
    { id: "categories", label: "دسته‌بندی‌ها", icon: "bi-tags", href: "categories.html" },
    { id: "products", label: "محصولات", icon: "bi-box-seam", href: "products.html" },
    { id: "customers", label: "مشتریان", icon: "bi-people", href: "customers.html" },
    { id: "orders", label: "سفارش‌ها", icon: "bi-cart-check", href: "orders.html" },
    { id: "reports", label: "گزارش‌ها", icon: "bi-bar-chart-line", href: "reports.html" },
    { id: "settings", label: "تنظیمات", icon: "bi-building-gear", href: "settings.html" },
    { id: "profile", label: "پروفایل مدیر", icon: "bi-person-circle", href: "profile.html" }
  ];

  const customerItems = [
    { id: "dashboard", label: "داشبورد", icon: "bi-house-heart", href: "index.html" },
    { id: "orders", label: "سفارش‌های من", icon: "bi-bag-check", href: "orders.html" },
    { id: "profile", label: "پروفایل", icon: "bi-person-circle", href: "profile.html" }
  ];

  function currentRole() {
    return document.body.dataset.panelRole || (cfg.panel.name === "admin" ? "Admin" : "Customer");
  }

  function currentPage() {
    return document.body.dataset.page || "dashboard";
  }

  function renderNav() {
    const nav = document.querySelector("#sidebar nav, .sidebar-nav, [data-sidebar] nav");
    if (!nav) return;
    const items = currentRole() === "Admin" ? adminItems : customerItems;
    const active = currentPage();
    nav.innerHTML = items.map((item) => `
      <a href="${item.href}" class="nav-link sidebar-link ${item.id === active ? "active" : ""}" data-page="${item.id}">
        <i class="bi ${item.icon}" aria-hidden="true"></i>
        <span>${item.label}</span>
      </a>`).join("") + `
      <a href="${cfg.panel.visitor}index.html" class="nav-link sidebar-link">
        <i class="bi bi-shop" aria-hidden="true"></i>
        <span>بازگشت به فروشگاه</span>
      </a>`;
  }

  function bindSidebarToggle() {
    const sidebar = document.querySelector("#sidebar, .admin-sidebar");
    document.querySelectorAll("[data-sidebar-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => sidebar?.classList.toggle("is-open"));
    });
  }

  async function init() {
    const role = currentRole();
    if (!window.Auth.requireRole(role)) return null;
    const user = await window.Auth.loadAuthenticatedUser();
    if (!user || !window.Auth.hasRole(role)) {
      window.Auth.clear();
      window.Auth.redirectToLogin(location.href);
      return null;
    }
    renderNav();
    window.PanelUI.setText("[data-admin-name], [data-customer-name]", window.Auth.displayName(user));
    window.PanelUI.bindLogout();
    bindSidebarToggle();
    return user;
  }

  return { init, currentRole, currentPage };
})();
