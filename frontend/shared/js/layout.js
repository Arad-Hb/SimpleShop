window.Layout = (function () {
  const cfg = window.AppConfig;
  let settings = null;
  let categories = [];
  let latestProducts = [];

  function brandName() {
    return settings?.storeName || cfg.siteName;
  }

  function renderHeader() {
    const host = document.getElementById("store-header");
    if (!host) return;
    const user = window.Auth.getCurrentUser();
    const authHtml = user
      ? `<div class="header-user-wrap">
           <a href="${window.Auth.hasRole("Admin") ? cfg.panel.admin + "index.html" : cfg.panel.customer + "index.html"}" class="header-user-chip">${window.Common.escapeHtml(window.Auth.displayName(user))}</a>
           <button type="button" class="header-logout-btn" data-visitor-logout>خروج</button>
         </div>`
      : `<a href="login.html" class="header-auth-btn"><span class="header-auth-text">ورود | ثبت‌نام</span></a>`;

    const menu = categories.map((cat) => {
      const children = (cat.children || []).map((child) =>
        `<a class="dropdown-item" href="category.html?id=${child.id}">${window.Common.escapeHtml(child.name)}</a>`
      ).join("");
      return `<li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="category.html?id=${cat.id}">${window.Common.escapeHtml(cat.name)}</a>
        ${children ? `<div class="dropdown-menu">${children}</div>` : ""}
      </li>`;
    }).join("");

    host.innerHTML = `
      <header class="store-header">
        <div class="container-xxl d-flex align-items-center gap-3 py-3">
          <a href="index.html" class="brand brand--tahlil">
            <img src="${cfg.brandLogo}" alt="${window.Common.escapeHtml(brandName())}" class="brand-logo-img" width="120" height="56">
            <span class="brand-text"><strong>${window.Common.escapeHtml(brandName())}</strong><small>${window.Common.escapeHtml(settings?.storeDescription || "فروشگاه اینترنتی آموزشی")}</small></span>
          </a>
          <form class="search-box search-box--minimal ms-auto" data-store-search>
            <input type="search" name="q" placeholder="جستجو..." aria-label="جستجو">
            <button type="submit" class="btn-search" aria-label="جستجو"><i class="bi bi-search"></i></button>
          </form>
          <div class="header-actions">
            ${authHtml}
            <a href="card.html" class="header-cart-btn" id="header-cart-link">سبد <span data-cart-count>${window.Cart.count()}</span></a>
          </div>
        </div>
        <nav class="store-nav"><div class="container-xxl"><ul class="nav">${menu}</ul></div></nav>
      </header>`;
  }

  function renderFooter() {
    const host = document.getElementById("store-footer");
    if (!host) return;
    const social = [
      ["instagramUrl", "اینستاگرام"],
      ["telegramUrl", "تلگرام"],
      ["whatsAppUrl", "واتساپ"]
    ].filter(([key]) => settings && settings[key]).map(([key, label]) =>
      `<a href="${window.Common.escapeHtml(settings[key])}" target="_blank" rel="noopener">${label}</a>`
    ).join(" · ");

    host.innerHTML = `
      <footer class="store-footer py-4">
        <div class="container-xxl">
          <strong>${window.Common.escapeHtml(brandName())}</strong>
          <p class="mb-1">${window.Common.escapeHtml(settings?.address || "")}</p>
          <p class="mb-1">${window.Common.escapeHtml(settings?.contactPhone || "")}</p>
          <div>${social}</div>
        </div>
      </footer>`;
  }

  function bind() {
    document.querySelector("[data-store-search]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const q = event.target.q?.value?.trim();
      location.href = q ? `search.html?q=${encodeURIComponent(q)}` : "search.html";
    });
    document.querySelector("[data-visitor-logout]")?.addEventListener("click", () => window.Auth.logout());
    document.addEventListener("cart:changed", (event) => {
      document.querySelectorAll("[data-cart-count]").forEach((el) => {
        el.textContent = event.detail?.count ?? window.Cart.count();
      });
    });
  }

  async function init() {
    try {
      const home = await window.Api.get(cfg.endpoints.storeHome);
      settings = home.data.settings || {};
      categories = home.data.categories || [];
      latestProducts = home.data.latestProducts || [];
      if (settings.storeName) document.title = document.title.replace(/^[^—]+/, settings.storeName + " ");
    } catch (error) {
      window.Common.handleError(error, "بارگذاری اطلاعات فروشگاه انجام نشد.");
    }
    await window.Auth.loadAuthenticatedUser();
    renderHeader();
    renderFooter();
    bind();
    return { settings, categories, latestProducts };
  }

  return { init, getSettings: () => settings, getCategories: () => categories, getLatestProducts: () => latestProducts };
})();
