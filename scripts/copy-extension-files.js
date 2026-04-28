const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist', 'bug-reporter', 'browser');
const srcDir = path.join(__dirname, '..', 'src');

// Copy manifest
fs.copyFileSync(path.join(srcDir, 'manifest.json'), path.join(distDir, 'manifest.json'));

// Copy icons
const iconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });
['icon16.png', 'icon48.png', 'icon128.png'].forEach(icon => {
  const src = path.join(srcDir, 'icons', icon);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(iconsDir, icon));
  }
});

console.log('Extension files copied to dist/bug-reporter/browser');
