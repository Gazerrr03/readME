import test from 'node:test';
import assert from 'node:assert/strict';
import {
  contentPath,
  desktopPath,
  readDesktopTarget,
} from '../../scripts/routing/content-routes.js';

test('builds site-relative content and desktop paths', () => {
  assert.equal(contentPath('writing', 'hello-world'), 'writing/hello-world/');
  assert.equal(contentPath('projects', 'signal-garden'), 'projects/signal-garden/');
  assert.equal(desktopPath('writing'), '?open=writing');
  assert.equal(desktopPath('projects'), '?open=projects');
});

test('rejects unsupported kinds and unsafe slugs', () => {
  assert.throws(() => contentPath('photos', 'coast'), /Unsupported content kind/);
  assert.throws(() => desktopPath('settings'), /Unsupported content kind/);

  for (const slug of ['', '../admin', 'Two Words', 'double--dash', 'trailing-']) {
    assert.throws(() => contentPath('writing', slug), /Invalid content slug/);
  }
});

test('reads only supported desktop targets', () => {
  assert.equal(readDesktopTarget('?open=projects'), 'projects');
  assert.equal(readDesktopTarget('?skipBoot=1&open=writing'), 'writing');
  assert.equal(readDesktopTarget('?open=settings'), null);
  assert.equal(readDesktopTarget('?open=../writing'), null);
  assert.equal(readDesktopTarget(''), null);
});
