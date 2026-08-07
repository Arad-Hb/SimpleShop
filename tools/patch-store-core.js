const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/VisitorPanel/js/store-core.js');
let s = fs.readFileSync(file, 'utf8');

const demoBlock =
  /const DEMO_CATEGORIES = \[[\s\S]*?\];\r?\n\r?\n  let CATEGORIES = DEMO_CATEGORIES\.slice\(\);\r?\n  let CATEGORY_TREE = \[\];\r?\n  let source = 'demo';\r?\n\r?\n  const DEMO_PRODUCTS = \[[\s\S]*?\];\r?\n\r?\n  let PRODUCTS = DEMO_PRODUCTS\.slice\(\);/;

if (!demoBlock.test(s)) {
  console.error('demo block not found');
  process.exit(1);
}

s = s.replace(
  demoBlock,
  "let CATEGORIES = [];\n  let CATEGORY_TREE = [];\n  let source = 'offline';\n\n  let PRODUCTS = [];"
);

const loadFromOffline = `
  const loadFromOffline = async () => {
    const loader = globalThis.SimpleShopOfflineData;
    if (!loader) return false;
    try {
      const [catData, prodData] = await Promise.all([
        loader.loadCategories(),
        loader.loadProducts()
      ]);
      const prodItems = (prodData.items || []).filter((p) => p.isActive !== false);
      if (!prodItems.length) return false;

      PRODUCTS = prodItems.map((dto, i) => mapApiProduct(dto, i));

      const tree = catData.tree || [];
      if (tree.length) {
        CATEGORY_TREE = tree
          .map((node, i) => normalizeTreeNode(node, i))
          .filter(Boolean);
        CATEGORIES = CATEGORY_TREE.slice(0, 8).map(({ id, name, icon }, i) => ({
          id,
          name,
          icon: icon || ICONS[i % ICONS.length]
        }));
      } else {
        const flat = (catData.items || []).filter((c) => c.isActive !== false);
        CATEGORY_TREE = buildTreeFromFlat(flat);
        CATEGORIES = CATEGORY_TREE.slice(0, 8).map(({ id, name, icon }, i) => ({
          id,
          name,
          icon: icon || ICONS[i % ICONS.length]
        }));
      }

      source = 'offline';
      refreshCategoryNav();
      document.dispatchEvent(new CustomEvent('catalog:ready', { detail: { source } }));
      return true;
    } catch (err) {
      console.warn('[VisitorPanel] Offline JSON unavailable.', err);
      return false;
    }
  };
`;

if (!s.includes('const loadFromOffline')) {
  s = s.replace('  const loadFromApi = async () => {', loadFromOffline + '\n  const loadFromApi = async () => {');
}

const readyBlock =
  /  const ready = \(async \(\) => \{[\s\S]*?  \}\)\(\);/;

const newReady = `  const ready = (async () => {
    try {
      if (Store.config?.USE_API) {
        const ok = await loadFromApi();
        if (ok) return { source };
      }
    } catch (err) {
      console.warn('[VisitorPanel] API unavailable, trying offline JSON.', err);
    }
    try {
      const ok = await loadFromOffline();
      if (ok) return { source };
    } catch (err) {
      console.warn('[VisitorPanel] Offline JSON unavailable.', err);
    }
    PRODUCTS = [];
    CATEGORIES = [];
    CATEGORY_TREE = [];
    source = 'empty';
    refreshCategoryNav();
    document.dispatchEvent(new CustomEvent('catalog:ready', { detail: { source } }));
    return { source };
  })();`;

if (!readyBlock.test(s)) {
  console.error('ready block not found');
  process.exit(1);
}
s = s.replace(readyBlock, newReady);

if (!s.includes('loadFromOffline,')) {
  s = s.replace('    loadFromApi,', '    loadFromApi,\n    loadFromOffline,');
}

fs.writeFileSync(file, s, 'utf8');
console.log('patched store-core.js');
