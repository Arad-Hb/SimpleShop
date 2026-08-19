window.Common = (function () {
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[c]));
  }

  function mediaUrl(path, fallback) {
    if (!path) return fallback || window.AppConfig.defaultProductImage;
    if (/^https?:\/\//i.test(path)) return path;
    return `${window.AppConfig.mediaBaseUrl.replace(/\/$/, "")}/${String(path).replace(/^\//, "")}`;
  }

  function formatPrice(value) {
    if (value === null || value === undefined || value === "") return "قیمت درج نشده";
    return `${Number(value).toLocaleString("fa-IR")} تومان`;
  }

  function loadingMarkup(message) {
    return `<div class="api-loading text-center py-5 text-muted">${escapeHtml(message || "در حال بارگذاری...")}</div>`;
  }

  function emptyMarkup(message) {
    return `<div class="empty-state text-center py-5 text-muted">${escapeHtml(message || "موردی یافت نشد.")}</div>`;
  }

  function errorMarkup(message) {
    return `<div class="api-error text-center py-5"><strong>دریافت اطلاعات انجام نشد</strong><div class="text-muted mt-2">${escapeHtml(message || "لطفاً دوباره تلاش کنید.")}</div><button class="btn btn-primary btn-sm mt-3" data-retry>تلاش مجدد</button></div>`;
  }

  function query(name, fallback) {
    const value = new URLSearchParams(location.search).get(name);
    return value == null || value === "" ? fallback : value;
  }

  function statusTitle(status) {
    return ({
      pending: "در انتظار",
      processing: "در حال پردازش",
      shipped: "ارسال شده",
      delivered: "تحویل شده",
      cancelled: "لغو شده"
    })[String(status || "").toLowerCase()] || status || "—";
  }

  function productCard(product) {
    const image = mediaUrl(product.thumbnailPath || product.imagePath);
    return `<article class="product-card">
      <a href="product.html?id=${product.id}">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}">
        <h3>${escapeHtml(product.name)}</h3>
        <div class="price">${formatPrice(product.price)}</div>
      </a>
      <button type="button" class="btn btn-sm btn-primary" data-add-cart="${product.id}">افزودن به سبد</button>
    </article>`;
  }

  function bindAddToCart(root) {
    (root || document).querySelectorAll("[data-add-cart]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.Cart.add(btn.getAttribute("data-add-cart"), 1);
        window.Toast.success("محصول به سبد خرید اضافه شد.");
      });
    });
  }

  function handleError(error, fallback) {
    const normalized = window.Api.normalizeError(error);
    window.Toast.error(normalized.message || fallback || "عملیات انجام نشد.");
    return normalized;
  }

  return { escapeHtml, mediaUrl, formatPrice, loadingMarkup, emptyMarkup, errorMarkup, query, statusTitle, handleError, productCard, bindAddToCart };
})();
