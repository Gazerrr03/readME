import test from 'node:test';
import assert from 'node:assert/strict';

import { createContentStore } from '../../scripts/content/content-store.js';
import { createDefaultContentDocument } from '../../scripts/content/default-document.js';
import {
  connectReviewPreview,
  createReviewPublisher,
} from '../../scripts/content/review-preview.js';

function fakeChannel() {
  const listeners = new Set();
  return {
    sent: [],
    closed: false,
    addEventListener(type, listener) {
      if (type === 'message') listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === 'message') listeners.delete(listener);
    },
    postMessage(message) { this.sent.push(message); },
    emit(data) { listeners.forEach((listener) => listener({ data })); },
    close() { this.closed = true; },
  };
}

test('normal site does not create a review channel', () => {
  const contentStore = createContentStore({ defaultDocument: createDefaultContentDocument() });
  let opened = false;
  const cleanup = connectReviewPreview({
    location: new URL('https://example.test/'),
    contentStore,
    channelFactory: () => { opened = true; },
  });
  cleanup();
  assert.equal(opened, false);
});

test('preview validates a message before replacing content', () => {
  const validDocument = createDefaultContentDocument();
  const contentStore = createContentStore({ defaultDocument: validDocument });
  const channel = fakeChannel();
  const cleanup = connectReviewPreview({
    location: new URL('https://example.test/?reviewPreview=1&channel=test'),
    contentStore,
    channelFactory: () => channel,
  });

  const changed = createDefaultContentDocument();
  changed.fields['ui.site.title'].values['zh-CN'] = '预览中的新标题';
  channel.emit({ type: 'content-document', document: changed });
  assert.equal(contentStore.document.fields['ui.site.title'].values['zh-CN'], '预览中的新标题');

  channel.emit({ type: 'content-document', document: { schemaVersion: 99 } });
  channel.emit({ type: 'content-document', document: changed, extra: true });
  assert.equal(contentStore.document.fields['ui.site.title'].values['zh-CN'], '预览中的新标题');

  cleanup();
  assert.equal(channel.closed, true);
});

test('publisher emits cloned content messages and closes its channel', () => {
  const channel = fakeChannel();
  const publisher = createReviewPublisher({
    channelName: 'test',
    channelFactory: () => channel,
  });
  const document = createDefaultContentDocument();
  publisher.publish(document);
  document.fields['ui.site.title'].values['zh-CN'] = '发布后发生的修改';

  assert.equal(channel.sent.length, 1);
  assert.equal(channel.sent[0].type, 'content-document');
  assert.notEqual(
    channel.sent[0].document.fields['ui.site.title'].values['zh-CN'],
    '发布后发生的修改',
  );
  publisher.close();
  assert.equal(channel.closed, true);
});
