import { createContentStore } from '../content/content-store.js';
import { defaultContentDocument } from '../content/default-document.js';
import { createReviewPublisher } from '../content/review-preview.js';
import { createWritingReviewApp } from './editor-view.js';
import { createReviewStorage } from './review-storage.js';
import { translateItems } from './translation-client.js';
import { createTranslationQueue } from './translation-queue.js';

const root = document.querySelector('[data-writing-review]');
const channelName = `portfolio-writing-${crypto.randomUUID()}`;
const publisher = createReviewPublisher({ channelName });
const previewUrl = new URL('/', location.origin);
previewUrl.searchParams.set('skipBoot', '1');
previewUrl.searchParams.set('reviewPreview', '1');
previewUrl.searchParams.set('channel', channelName);
const contentStore = createContentStore({ defaultDocument: defaultContentDocument });
await contentStore.loadPublished('/content/content.json');
const storage = createReviewStorage();
const draft = await storage.loadDraft();
if (draft) {
  try {
    contentStore.replace(draft);
  } catch {
    // Invalid stale drafts never replace the published snapshot.
  }
}

const queue = createTranslationQueue({
  storage,
  translate: (items) => translateItems(items),
  getDocument: () => contentStore.document,
  replaceDocument: (next) => contentStore.replace(next),
});
await queue.ready;
createWritingReviewApp({
  root,
  contentStore,
  defaults: defaultContentDocument,
  storage,
  queue,
  channel: publisher,
  previewUrl: previewUrl.href,
});
void queue.recover('route-open');
window.addEventListener('online', () => { void queue.recover('online'); });
window.addEventListener('pagehide', () => publisher.close(), { once: true });
