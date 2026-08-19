window.Cart = (function () {
  const key = () => window.AppConfig.cartStorageKey;

  function read() {
    try {
      const raw = JSON.parse(localStorage.getItem(key()) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw
        .map((item) => ({
          productId: Number(item.productId || item.id),
          quantity: Math.max(1, Number(item.quantity || item.qty || 1))
        }))
        .filter((item) => item.productId > 0);
    } catch {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(key(), JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("cart:changed", { detail: { count: count() } }));
  }

  function count() {
    return read().reduce((sum, item) => sum + item.quantity, 0);
  }

  function add(productId, quantity) {
    const id = Number(productId);
    const qty = Math.max(1, Number(quantity || 1));
    const items = read();
    const existing = items.find((item) => item.productId === id);
    if (existing) existing.quantity += qty;
    else items.push({ productId: id, quantity: qty });
    write(items);
    return items;
  }

  function setQuantity(productId, quantity) {
    const id = Number(productId);
    const qty = Number(quantity);
    let items = read();
    if (qty <= 0) items = items.filter((item) => item.productId !== id);
    else {
      const existing = items.find((item) => item.productId === id);
      if (existing) existing.quantity = qty;
      else items.push({ productId: id, quantity: qty });
    }
    write(items);
    return items;
  }

  function remove(productId) {
    write(read().filter((item) => item.productId !== Number(productId)));
  }

  function clear() {
    write([]);
  }

  return { read, write, count, add, setQuantity, remove, clear };
})();
