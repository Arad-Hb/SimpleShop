const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'frontend');
const OFFLINE_TAG = '../shared/js/offline-data.js';

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('offline-data.js')) return false;

  let changed = false;

  if (filePath.includes(`${path.sep}VisitorPanel${path.sep}`)) {
    const re = /(\s*)<script src="js\/store-core\.js"><\/script>/;
    if (re.test(content)) {
      content = content.replace(re, `$1<script src="${OFFLINE_TAG}"></script>\n$1<script src="js/store-core.js"></script>`);
      changed = true;
    }
  }

  const seedRe = /(\s*)<script src="assets\/js\/seed-data\.js"><\/script>/;
  if (seedRe.test(content)) {
    content = content.replace(seedRe, `$1<script src="${OFFLINE_TAG}"></script>\n$1<script src="assets/js/seed-data.js"></script>`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('patched', filePath);
  }
  return changed;
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.html')) patchFile(full);
  }
}

walk(ROOT);
console.log('done');
