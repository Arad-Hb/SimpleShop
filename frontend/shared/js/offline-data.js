/**
 * offline-data.js — load shared JSON catalog/users/orders for offline fallback
 *
 * Files live in ../shared/files/ relative to each panel.
 * Set SimpleShopOfflineData.basePath before loading if needed.
 */
(function (global) {
  'use strict';

  const DEFAULT_BASE = '../shared/files';
  const cache = {};

  function resolveBase() {
    const cfg = global.SimpleShopOfflineData || {};
    return (cfg.basePath || DEFAULT_BASE).replace(/\/$/, '');
  }

  async function fetchJson(name) {
    if (cache[name]) return cache[name];
    const url = `${resolveBase()}/${name}.json`;
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    const data = await res.json();
    cache[name] = data;
    return data;
  }

  function buildCategoryTree(flat) {
    const byId = new Map();
    flat.forEach((c) => {
      byId.set(c.id, { ...c, children: [] });
    });
    const roots = [];
    flat.forEach((c) => {
      const node = byId.get(c.id);
      if (c.parentId == null) {
        roots.push(node);
      } else {
        const parent = byId.get(c.parentId);
        if (parent) parent.children.push(node);
        else roots.push(node);
      }
    });
    const sortNodes = (nodes) => {
      nodes.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.id - b.id);
      nodes.forEach((n) => sortNodes(n.children || []));
    };
    sortNodes(roots);
    return roots;
  }

  async function loadCategories() {
    const data = await fetchJson('categories');
    const items = (data.items || []).filter((c) => c.isActive !== false);
    return { ...data, items, tree: buildCategoryTree(items) };
  }

  async function loadProducts() {
    return fetchJson('products');
  }

  async function loadUsers() {
    return fetchJson('users');
  }

  async function loadOrders() {
    return fetchJson('orders');
  }

  async function loadAll() {
    const [categories, products, users, orders] = await Promise.all([
      loadCategories(),
      loadProducts(),
      loadUsers(),
      loadOrders()
    ]);
    return { categories, products, users, orders };
  }

  async function isApiOnline(baseUrl, timeoutMs = 4000) {
    if (!baseUrl) return false;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(`${String(baseUrl).replace(/\/$/, '')}/api/products?page=1&pageSize=1`, {
        signal: ctrl.signal,
        method: 'GET'
      });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  }

  global.SimpleShopOfflineData = {
    basePath: DEFAULT_BASE,
    fetchJson,
    loadCategories,
    loadProducts,
    loadUsers,
    loadOrders,
    loadAll,
    buildCategoryTree,
    isApiOnline,
    clearCache() {
      Object.keys(cache).forEach((k) => delete cache[k]);
    }
  };
})(window);
