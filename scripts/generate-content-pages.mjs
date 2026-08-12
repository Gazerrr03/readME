import {
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { articles, projects } from './data/content.js';
import { contentPath } from './routing/content-routes.js';

const MANIFEST = 'content-pages.manifest.json';
const OWNED_PATH = /^(writing|projects)\/[a-z0-9]+(?:-[a-z0-9]+)*\/index\.html$/;
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function excerpt(value, length = 180) {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= length) return normalized;
  return `${normalized.slice(0, length - 1).trimEnd()}…`;
}

export function buildContentEntries() {
  const entries = [
    ...articles.map((article) => ({
      kind: 'writing',
      slug: article.slug,
      title: article.title.en,
      description: excerpt(article.body.en.find((item) => typeof item === 'string')),
      ogType: 'article',
    })),
    ...projects.map((project) => ({
      kind: 'projects',
      slug: project.slug,
      title: project.title.en,
      description: project.description.en,
      ogType: 'website',
    })),
  ];
  const paths = new Set();
  for (const entry of entries) {
    const path = contentPath(entry.kind, entry.slug);
    if (paths.has(path)) throw new Error(`Duplicate content route: ${path}`);
    if (!entry.title || !entry.description) throw new Error(`Missing English metadata: ${path}`);
    paths.add(path);
  }
  return entries.sort((left, right) => (
    `${left.kind}/${left.slug}`.localeCompare(`${right.kind}/${right.slug}`)
  ));
}

export function renderEntryPage(entry) {
  const title = escapeHtml(`${entry.title} - QIZHI`);
  const description = escapeHtml(entry.description);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <base href="../../">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:type" content="${entry.ogType}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <link rel="stylesheet" href="styles/tokens.css">
  <link rel="stylesheet" href="styles/content-page.css">
</head>
<body data-content-kind="${entry.kind}" data-content-slug="${entry.slug}">
  <div data-content-page></div>
  <script type="module" src="scripts/pages/content-page.js"></script>
</body>
</html>
`;
}

function outputFor(entry) {
  return `${contentPath(entry.kind, entry.slug)}index.html`;
}

async function readManifest(root) {
  try {
    const manifest = JSON.parse(await readFile(join(root, MANIFEST), 'utf8'));
    return Array.isArray(manifest.files) ? manifest.files : [];
  } catch {
    return [];
  }
}

async function readOrMissing(file) {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function generateContentPages({ root = PROJECT_ROOT, check = false } = {}) {
  const entries = buildContentEntries();
  const expected = new Map(entries.map((entry) => [outputFor(entry), renderEntryPage(entry)]));
  const files = [...expected.keys()].sort();
  const manifestSource = `${JSON.stringify({ files }, null, 2)}\n`;
  const previousFiles = await readManifest(root);

  if (check) {
    const stale = [];
    for (const [relativePath, source] of expected) {
      if (await readOrMissing(join(root, relativePath)) !== source) stale.push(relativePath);
    }
    if (await readOrMissing(join(root, MANIFEST)) !== manifestSource) stale.push(MANIFEST);
    previousFiles.filter((file) => !expected.has(file)).forEach((file) => stale.push(file));
    if (stale.length) {
      throw new Error(`Generated content pages are stale: ${[...new Set(stale)].sort().join(', ')}`);
    }
    return { files };
  }

  for (const stale of previousFiles.filter((file) => !expected.has(file))) {
    if (!OWNED_PATH.test(stale)) throw new Error(`Refusing to remove unowned path: ${stale}`);
    await rm(dirname(join(root, stale)), { recursive: true, force: true });
  }
  for (const [relativePath, source] of expected) {
    const target = join(root, relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, source);
  }
  await writeFile(join(root, MANIFEST), manifestSource);
  return { files };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  try {
    const { files } = await generateContentPages({ check });
    console.log(`${check ? 'Checked' : 'Generated'} ${files.length} content pages.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
