import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];
const warnings = [];
const shouldCheckExtensionPackage = process.argv.includes('--extension-package');

const read = (path) => readFileSync(join(root, path), 'utf8');
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;

const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);

const collectFiles = (dir, extension) => {
  const result = [];

  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const relativePath = join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push(...collectFiles(relativePath, extension));
      continue;
    }

    if (entry.name.endsWith(extension)) {
      result.push(relativePath);
    }
  }

  return result;
};

const checkStaticHtml = () => {
  const html = read('index.html');

  if (!/<title>[^<]+<\/title>/.test(html)) {
    fail('index.html is missing a document title.');
  }

  if (!/<meta\s+name="description"\s+content="[^"]{40,}"/.test(html)) {
    fail('index.html needs a meaningful meta description.');
  }

  if (!/<meta\s+name="viewport"/.test(html)) {
    fail('index.html is missing a viewport meta tag.');
  }

  if (!/<link\s+rel="icon"/.test(html)) {
    fail('index.html is missing a favicon link.');
  }

  if (!/<main\b[^>]*id="app"/.test(html)) {
    fail('The app shell should keep a main landmark with id="app".');
  }

  if (/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/.test(html)) {
    fail('index.html contains an inline script. Extension pages should use local external scripts for CSP compatibility.');
  }

  const buttonMatches = html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g);

  for (const match of buttonMatches) {
    const attributes = match[1];
    const content = match[2].replace(/<[^>]+>/g, '').trim();
    const hasAriaLabel = /\saria-label="[^"]+"/.test(attributes);
    const hasTitle = /\stitle="[^"]+"/.test(attributes);

    if (!content && !hasAriaLabel && !hasTitle) {
      fail(`A static button is missing an accessible name: <button${attributes}>`);
    }
  }

  const dialogs = html.matchAll(/<([a-z]+)\b([^>]*role="dialog"[^>]*)>/g);

  for (const match of dialogs) {
    const attributes = match[2];
    const hasName = /\saria-label="[^"]+"/.test(attributes) || /\saria-labelledby="[^"]+"/.test(attributes);
    const hasModalState = /\saria-modal="true"/.test(attributes);

    if (!hasName) {
      fail('A dialog is missing aria-label or aria-labelledby.');
    }

    if (!hasModalState) {
      fail('A dialog is missing aria-modal="true".');
    }
  }
};

const checkCssVariables = () => {
  const cssFiles = collectFiles('src/styles', '.css');
  const tsFiles = collectFiles('src', '.ts');
  const definitionPattern = /--([a-z0-9-]+)\s*:/gi;
  const jsDefinitionPattern = /setProperty\(\s*['"]--([a-z0-9-]+)['"]/gi;
  const usagePattern = /var\(\s*--([a-z0-9-]+)/gi;
  const definitions = new Set();
  const usages = new Map();

  for (const file of cssFiles) {
    const source = read(file);

    for (const match of source.matchAll(definitionPattern)) {
      definitions.add(match[1]);
    }

    for (const match of source.matchAll(usagePattern)) {
      const name = match[1];
      usages.set(name, [...(usages.get(name) ?? []), file]);
    }
  }

  for (const file of tsFiles) {
    const source = read(file);

    for (const match of source.matchAll(jsDefinitionPattern)) {
      definitions.add(match[1]);
    }
  }

  for (const [name, files] of usages) {
    if (!definitions.has(name)) {
      fail(`CSS custom property --${name} is used but not defined. Seen in ${[...new Set(files)].join(', ')}.`);
    }
  }
};

const checkBundleBudget = () => {
  const distAssetsPath = join(root, 'dist/assets');

  if (!existsSync(distAssetsPath)) {
    warn('dist/assets is missing. Run npm run build before checking bundle budgets.');
    return;
  }

  const budgets = [
    { extension: '.js', maxBytes: 60 * 1024, label: 'JavaScript bundle' },
    { extension: '.css', maxBytes: 90 * 1024, label: 'CSS bundle' },
    { extension: '.png', maxBytes: 360 * 1024, label: 'PNG asset' },
  ];

  for (const entry of readdirSync(distAssetsPath)) {
    const filePath = join(distAssetsPath, entry);
    const stat = statSync(filePath);
    const budget = budgets.find((item) => entry.endsWith(item.extension));

    if (budget && stat.size > budget.maxBytes) {
      fail(`${budget.label} ${entry} is ${kb(stat.size)}, above the ${kb(budget.maxBytes)} budget.`);
    }
  }
};

const checkNoExtensionUnsafeReferences = (file, source) => {
  const remoteReference = source.match(/https?:\/\//);
  const absoluteAssetReference = source.match(/\b(?:href|src)=["']\/(?!\/)/);
  const devSourceReference = source.match(/["']\/src\//);

  if (remoteReference) {
    fail(`${file} contains a remote URL. Extension package resources should be local.`);
  }

  if (absoluteAssetReference) {
    fail(`${file} contains an absolute href/src path. Extension package assets should use relative paths.`);
  }

  if (devSourceReference) {
    fail(`${file} references /src/. Extension package should reference built assets only.`);
  }
};

const checkRequiredAssets = () => {
  const requiredFiles = [
    'public/favicon.svg',
    'extension/manifest.json',
    'extension/background.js',
    'extension/icons/icon-16.png',
    'extension/icons/icon-32.png',
    'extension/icons/icon-48.png',
    'extension/icons/icon-128.png',
    'src/assets/hand-wand.png',
    'README.md',
  ];

  for (const file of requiredFiles) {
    if (!existsSync(join(root, file))) {
      fail(`Required project asset is missing: ${file}.`);
    }
  }
};

const checkExtensionManifest = () => {
  const manifestPath = 'extension/manifest.json';
  const manifest = JSON.parse(read(manifestPath));

  if (manifest.manifest_version !== 3) {
    fail('extension/manifest.json must use Manifest V3.');
  }

  if (!manifest.name || !manifest.description || !manifest.version) {
    fail('extension/manifest.json needs name, description, and version.');
  }

  if (!manifest.action?.default_title) {
    fail('extension/manifest.json needs action.default_title for the toolbar icon.');
  }

  for (const permission of ['tabs', 'storage']) {
    if (!manifest.permissions?.includes(permission)) {
      fail(`extension/manifest.json should include the "${permission}" permission.`);
    }
  }

  if (manifest.background?.service_worker !== 'background.js') {
    fail('extension/manifest.json should point background.service_worker to background.js.');
  }

  if (!existsSync(join(root, 'extension/background.js'))) {
    fail('extension/background.js is missing.');
  }

  for (const size of ['16', '32', '48', '128']) {
    const iconPath = manifest.icons?.[size];

    if (!iconPath) {
      fail(`extension/manifest.json is missing icons.${size}.`);
      continue;
    }

    if (!iconPath.endsWith('.png')) {
      fail(`extension/manifest.json icon ${size} should be a PNG file.`);
    }

    if (!existsSync(join(root, 'extension', iconPath))) {
      fail(`extension/manifest.json references a missing icon: ${iconPath}.`);
    }
  }
};

const checkExtensionPackage = () => {
  const distExtensionPath = join(root, 'dist-extension');

  if (!existsSync(distExtensionPath)) {
    fail('dist-extension is missing. Run npm run build:extension before extension package checks.');
    return;
  }

  const requiredPackageFiles = [
    'dist-extension/index.html',
    'dist-extension/manifest.json',
    'dist-extension/background.js',
    'dist-extension/init-preferences.js',
    'dist-extension/icons/icon-16.png',
    'dist-extension/icons/icon-32.png',
    'dist-extension/icons/icon-48.png',
    'dist-extension/icons/icon-128.png',
  ];

  for (const file of requiredPackageFiles) {
    if (!existsSync(join(root, file))) {
      fail(`Extension package is missing ${file}.`);
    }
  }

  const manifest = JSON.parse(read('dist-extension/manifest.json'));

  if (manifest.manifest_version !== 3) {
    fail('dist-extension/manifest.json must use Manifest V3.');
  }

  if (manifest.background?.service_worker !== 'background.js') {
    fail('dist-extension/manifest.json should point background.service_worker to background.js.');
  }

  for (const permission of ['tabs', 'storage']) {
    if (!manifest.permissions?.includes(permission)) {
      fail(`dist-extension/manifest.json should include the "${permission}" permission.`);
    }
  }

  for (const size of ['16', '32', '48', '128']) {
    const iconPath = manifest.icons?.[size];

    if (!iconPath || !existsSync(join(distExtensionPath, iconPath))) {
      fail(`dist-extension/manifest.json references a missing ${size}px icon.`);
    }

    if (iconPath && !iconPath.endsWith('.png')) {
      fail(`dist-extension/manifest.json icon ${size} should be a PNG file.`);
    }
  }

  const packageTextFiles = [
    ...collectFiles('dist-extension', '.html'),
    ...collectFiles('dist-extension', '.js'),
    ...collectFiles('dist-extension', '.css'),
    ...collectFiles('dist-extension', '.json'),
  ];

  for (const file of packageTextFiles) {
    const source = read(file);
    checkNoExtensionUnsafeReferences(file, source);

    if (file.endsWith('.html') && /<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/.test(source)) {
      fail(`${file} contains inline script. Extension pages should use local external scripts.`);
    }
  }
};

checkStaticHtml();
checkCssVariables();
checkRequiredAssets();
checkExtensionManifest();
checkBundleBudget();

if (shouldCheckExtensionPackage) {
  checkExtensionPackage();
}

for (const message of warnings) {
  console.warn(`Warning: ${message}`);
}

if (errors.length > 0) {
  console.error('\nQuality check failed:');
  errors.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log('Quality check passed.');
