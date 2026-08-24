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
const FEED_PATH = 'feed.xml';
const SITE_BASE_URL = 'https://gazerrr03.github.io/readME/';
const FEED_LOCALE = 'zh-CN';
const OWNED_PATH = /^(?:feed\.xml|(writing|projects)\/[a-z0-9]+(?:-[a-z0-9]+)*\/(index\.html|en\.md|zh\.md|ja\.md))$/;
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MARKDOWN_LOCALES = Object.freeze([
  ['en', 'en'],
  ['zh-CN', 'zh'],
  ['ja', 'ja'],
]);

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function excerpt(value, length = 180) {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= length) return normalized;
  return `${normalized.slice(0, length - 1).trimEnd()}…`;
}

function isoDate(date) {
  return `${date}T00:00:00Z`;
}

function rfc822Date(date) {
  return new Date(isoDate(date)).toUTCString();
}

function articleSummary(article, localeKey) {
  return excerpt(article.body[localeKey]?.find((item) => typeof item === 'string'));
}

function articleFeedEntries() {
  return [...articles].sort((left, right) => (
    right.edited.localeCompare(left.edited) || right.date.localeCompare(left.date)
  ));
}

export function renderFeed() {
  const latestEdited = articles.reduce(
    (latest, article) => (article.edited > latest ? article.edited : latest),
    articles[0]?.edited ?? '1970-01-01',
  );
  const items = articleFeedEntries().map((article) => {
    const canonicalUrl = `${SITE_BASE_URL}${contentPath('writing', article.slug)}`;
    const localizedUrl = `${canonicalUrl}?lang=${encodeURIComponent(FEED_LOCALE)}`;
    const title = localizedValue(article.title, FEED_LOCALE);
    const summary = articleSummary(article, FEED_LOCALE);
    const modified = article.edited ?? article.date;
    return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(localizedUrl)}</link>
      <guid isPermaLink="true">${escapeXml(canonicalUrl)}</guid>
      <pubDate>${rfc822Date(modified)}</pubDate>
      <description>${escapeXml(summary)}</description>
      <category>${escapeXml(article.tag)}</category>
      <dc:language>${escapeXml(FEED_LOCALE)}</dc:language>
      <dcterms:created>${isoDate(article.date)}</dcterms:created>
      <dcterms:modified>${isoDate(modified)}</dcterms:modified>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dcterms="http://purl.org/dc/terms/">
  <channel>
    <title>QIZHI / Writing</title>
    <link>${escapeXml(SITE_BASE_URL)}</link>
    <description>Qizhi's writing archive, generated from the Portfolio OS article source.</description>
    <language>${escapeXml(FEED_LOCALE)}</language>
    <atom:link href="${escapeXml(`${SITE_BASE_URL}${FEED_PATH}`)}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${rfc822Date(latestEdited)}</lastBuildDate>
    <generator>Portfolio OS static generator</generator>
${items.join('\n')}
  </channel>
</rss>
`;
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

function localizedValue(value, localeKey) {
  return value?.[localeKey] ?? value?.en ?? '';
}

export function renderArticleMarkdown(article, localeKey) {
  const lines = [];
  lines.push(`# ${localizedValue(article.title, localeKey)}`, '');
  lines.push(`Published: ${article.date}`);
  if (article.edited && article.edited !== article.date) {
    lines.push(`Last edited: ${article.edited}`);
  }
  lines.push(`Tag: ${article.tag}`, '');
  const body = article.body[localeKey] ?? article.body.en;
  for (const item of body) {
    if (typeof item === 'string') {
      lines.push(item, '');
    } else if (item.h) {
      lines.push(`## ${item.h}`, '');
    } else if (item.q) {
      const quoteLines = item.q.split('\n');
      const quote = quoteLines
        .map((line, index) => `> ${line}${index < quoteLines.length - 1 ? '\\' : ''}`)
        .join('\n');
      lines.push(quote, '');
    } else if (item.a) {
      lines.push(`[${item.a}](${item.href})${item.rest ?? ''}`, '');
    }
  }
  if (article.notes) {
    lines.push('---', '', `Field notes: ${localizedValue(article.notes, localeKey)}`, '');
  }
  return `${lines.join('\n')}`;
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
  expected.set(FEED_PATH, renderFeed());
  for (const article of articles) {
    for (const [localeKey, fileName] of MARKDOWN_LOCALES) {
      expected.set(
        `writing/${article.slug}/${fileName}.md`,
        renderArticleMarkdown(article, localeKey),
      );
    }
  }
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
    const target = join(root, stale);
    if (stale === FEED_PATH) {
      await rm(target, { force: true });
    } else {
      await rm(dirname(target), { recursive: true, force: true });
    }
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
