window.Api = (function () {
  const client = axios.create({
    baseURL: window.AppConfig.apiBaseUrl,
    timeout: 20000,
    headers: { Accept: "application/json" }
  });

  client.interceptors.request.use(function (config) {
    const token = window.Auth && window.Auth.getAccessToken ? window.Auth.getAccessToken() : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  function normalizeError(error) {
    if (!error) return { status: 0, message: "خطای نامشخص رخ داد." };
    if (!error.response) return { status: 0, message: "ارتباط با API برقرار نشد. اجرای API روی پورت ۵۱۰۲ را بررسی کنید." };
    const data = error.response.data || {};
    let message = data.message || data.Message || data.title || data.Title || `خطای سرور (${error.response.status})`;
    if (data.errors && typeof data.errors === "object") {
      const first = Object.values(data.errors).flat().filter(Boolean)[0];
      if (first) message = first;
    }
    return { status: error.response.status, message, data };
  }

  function upload(url, formData, config) {
    return client.post(url, formData, {
      ...(config || {}),
      headers: { ...((config && config.headers) || {}), "Content-Type": "multipart/form-data" }
    });
  }

  return {
    client,
    get: (url, config) => client.get(url, config),
    post: (url, data, config) => client.post(url, data, config),
    put: (url, data, config) => client.put(url, data, config),
    patch: (url, data, config) => client.patch(url, data, config),
    delete: (url, config) => client.delete(url, config),
    upload,
    normalizeError
  };
})();
