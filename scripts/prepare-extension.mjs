import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const distExtension = join(root, 'dist-extension');
const manifestSource = join(root, 'extension/manifest.json');
const backgroundSource = join(root, 'extension/background.js');
const iconsSource = join(root, 'extension/icons');
const manifestTarget = join(distExtension, 'manifest.json');
const backgroundTarget = join(distExtension, 'background.js');
const iconsTarget = join(distExtension, 'icons');

if (!existsSync(distExtension)) {
  throw new Error('dist-extension is missing. Run the Vite extension build before preparing the package.');
}

mkdirSync(dirname(manifestTarget), { recursive: true });
copyFileSync(manifestSource, manifestTarget);
copyFileSync(backgroundSource, backgroundTarget);
cpSync(iconsSource, iconsTarget, { recursive: true });

console.log('Extension package prepared in dist-extension.');
