window.Toast = (function () {
  function ensureHost() {
    let host = document.getElementById("appToastHost");
    if (!host) {
      host = document.createElement("div");
      host.id = "appToastHost";
      host.className = "app-toast-host";
      document.body.appendChild(host);
    }
    if (!document.getElementById("appToastStyle")) {
      const style = document.createElement("style");
      style.id = "appToastStyle";
      style.textContent = `
        .app-toast-host{position:fixed;z-index:2000;left:16px;bottom:16px;display:flex;flex-direction:column;gap:8px}
        .app-toast{display:flex;align-items:center;gap:10px;min-width:240px;max-width:360px;padding:12px 14px;border-radius:12px;color:#fff;background:#334155;box-shadow:0 10px 24px rgba(15,23,42,.18);opacity:0;transform:translateY(8px);transition:.25s}
        .app-toast.is-visible{opacity:1;transform:none}
        .app-toast--success{background:#0f9f6e}
        .app-toast--error{background:#dc3545}
        .app-toast--info{background:#0d6efd}
        .app-toast button{margin-right:auto;border:0;background:transparent;color:inherit;font-size:18px}
      `;
      document.head.appendChild(style);
    }
    return host;
  }

  function show(message, type) {
    const host = ensureHost();
    const toast = document.createElement("div");
    toast.className = `app-toast app-toast--${type || "info"}`;
    toast.innerHTML = `<span>${window.Common.escapeHtml(message)}</span><button type="button" aria-label="بستن">×</button>`;
    host.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    const remove = () => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 260);
    };
    toast.querySelector("button").addEventListener("click", remove);
    setTimeout(remove, 3600);
  }

  return {
    show,
    success: (message) => show(message, "success"),
    error: (message) => show(message, "error"),
    info: (message) => show(message, "info")
  };
})();
