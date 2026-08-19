(async function () {
  if (!await window.PanelLayout.init()) return;
  const form = document.getElementById("settings-form") || document.querySelector("form");
  if (!form) return;

  document.querySelector('[data-settings-tab="banners"]')?.classList.add("d-none");
  document.getElementById("banners-admin-root")?.setAttribute("hidden", "hidden");

  const aliases = {
    storeName: ["storeName", "shopName"],
    storeDescription: ["storeDescription", "shopDescription"],
    contactPhone: ["contactPhone"],
    contactEmail: ["contactEmail"],
    address: ["address"],
    currency: ["currency"],
    lowStockThreshold: ["lowStockThreshold"],
    instagramUrl: ["instagramUrl", "instagram"],
    telegramUrl: ["telegramUrl", "telegram"],
    whatsAppUrl: ["whatsAppUrl", "whatsapp"],
    defaultSeoTitle: ["defaultSeoTitle"],
    defaultSeoDescription: ["defaultSeoDescription"],
    heroTitle: ["heroTitle"],
    heroSubtitle: ["heroSubtitle"]
  };

  function field(ids) {
    for (const id of ids) {
      const el = form[id] || document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  try {
    const item = (await window.Api.get(window.AppConfig.endpoints.adminSettings)).data;
    Object.entries(aliases).forEach(([apiKey, ids]) => {
      const el = field(ids);
      if (el && el.type !== "file") el.value = item[apiKey] ?? "";
    });
  } catch (error) {
    window.Common.handleError(error);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {};
    Object.entries(aliases).forEach(([apiKey, ids]) => {
      const el = field(ids);
      if (!el || el.type === "file") return;
      payload[apiKey] = el.type === "number" ? Number(el.value || 0) : el.value;
    });
    try {
      const result = await window.Api.put(window.AppConfig.endpoints.adminSettings, payload);
      window.Toast.success(result.data.message);
      await uploadIfPresent(["logo-upload", "logo-file"], window.AppConfig.endpoints.adminLogo);
      await uploadIfPresent(["favicon-upload", "favicon-file"], window.AppConfig.endpoints.adminFavicon);
      await uploadIfPresent(["og-upload", "hero-file", "hero-upload"], window.AppConfig.endpoints.adminHero);
    } catch (error) {
      window.Common.handleError(error);
    }
  });

  async function uploadIfPresent(ids, url) {
    const input = ids.map((id) => document.getElementById(id)).find((el) => el?.files?.[0]);
    if (!input) return;
    const data = new FormData();
    data.append("file", input.files[0]);
    const result = await window.Api.upload(url, data);
    window.Toast.success(result.data.message);
  }
})();
