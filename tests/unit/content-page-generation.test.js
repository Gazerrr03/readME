import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { articles, projects } from '../../scripts/data/content.js';
import { generateContentPages } from '../../scripts/generate-content-pages.mjs';

async function temporaryRoot() {
  return mkdtemp(join(tmpdir(), 'portfolio-pages-'));
}

test('generates one metadata-rich physical page per content item', async () => {
  const root = await temporaryRoot();
  const result = await generateContentPages({ root, check: false });

  assert.equal(result.files.length, articles.length * 4 + projects.length);
  const file = join(root, 'writing', articles[0].slug, 'index.html');
  const html = await readFile(file, 'utf8');
  assert.match(html, /<base href="\.\.\/\.\.\/">/);
  assert.match(html, new RegExp(`data-content-slug="${articles[0].slug}"`));
  assert.match(html, /<meta property="og:type" content="article">/);
  assert.match(html, /<div data-content-page><\/div>/);

  const manifest = JSON.parse(await readFile(join(root, 'content-pages.manifest.json'), 'utf8'));
  assert.deepEqual(manifest.files, [...result.files].sort());
  await generateContentPages({ root, check: true });
});

test('every article ships machine-readable markdown editions in all locales', async () => {
  const root = await temporaryRoot();
  await generateContentPages({ root, check: false });

  for (const article of articles) {
    const english = await readFile(join(root, 'writing', article.slug, 'en.md'), 'utf8');
    assert.match(english, new RegExp(`^# ${article.title.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
    if (article.body.en.some((item) => item && item.h)) {
      assert.match(english, /^## /m);
    }
    assert.match(english, new RegExp(`Published: ${article.date}`));
    const chinese = await readFile(join(root, 'writing', article.slug, 'zh.md'), 'utf8');
    assert.match(chinese, new RegExp(`# ${article.title['zh-CN']}`));
    await readFile(join(root, 'writing', article.slug, 'ja.md'), 'utf8');
  }

  const longForm = articles.find((article) => article.notes);
  const english = await readFile(join(root, 'writing', longForm.slug, 'en.md'), 'utf8');
  assert.match(english, /^> /m);
  assert.match(english, /^Field notes: /m);
});

test('freshness check rejects modified output', async () => {
  const root = await temporaryRoot();
  const { files } = await generateContentPages({ root, check: false });
  await writeFile(join(root, files[0]), 'stale');

  await assert.rejects(
    generateContentPages({ root, check: true }),
    /Generated content pages are stale/,
  );
});

test('regeneration removes only stale paths owned by the previous manifest', async () => {
  const root = await temporaryRoot();
  await generateContentPages({ root, check: false });
  const stale = 'writing/removed-entry/index.html';
  const staleFile = join(root, stale);
  await writeFile(join(root, 'content-pages.manifest.json'), `${JSON.stringify({
    files: [stale],
  }, null, 2)}\n`);
  await mkdir(join(root, 'writing', 'removed-entry'), { recursive: true });
  await writeFile(staleFile, 'owned stale output');
  await writeFile(join(root, 'writing', 'keep.txt'), 'hand-written');

  await generateContentPages({ root, check: false });

  await assert.rejects(readFile(staleFile, 'utf8'), { code: 'ENOENT' });
  assert.equal(await readFile(join(root, 'writing', 'keep.txt'), 'utf8'), 'hand-written');
});
