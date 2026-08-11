export class TranslationError extends Error {
  constructor(category, cause) {
    super(`Translation failed: ${category}`, { cause });
    this.name = 'TranslationError';
    this.category = category;
  }
}

function validateResponse(payload, items) {
  if (!Array.isArray(payload?.translations)) throw new TranslationError('invalid-response');
  return items.map((item) => {
    const translation = payload.translations.find((candidate) => candidate?.id === item.id);
    const { en, ja } = translation?.values ?? {};
    if (typeof en !== 'string' || !en || typeof ja !== 'string' || !ja) {
      throw new TranslationError('invalid-response');
    }
    if ((item.preserveTokens ?? []).some((token) => !en.includes(token) || !ja.includes(token))) {
      throw new TranslationError('token-mismatch');
    }
    return { id: item.id, values: { en, ja } };
  });
}

export async function translateItems(items, {
  fetchImpl = globalThis.fetch,
  signal,
  endpoint = '/api/translate',
  timeoutMs = 15_000,
} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sourceLocale: 'zh-CN', targetLocales: ['en', 'ja'], items }),
      signal: controller.signal,
    });
    if (!response.ok) throw new TranslationError('http');
    return validateResponse(await response.json(), items);
  } catch (error) {
    if (error instanceof TranslationError) throw error;
    if (controller.signal.aborted) throw new TranslationError('timeout', error);
    throw new TranslationError('offline', error);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
