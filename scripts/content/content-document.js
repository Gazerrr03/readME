export const CONTENT_SCHEMA_VERSION = 1;
export const CONTENT_LOCALES = Object.freeze(['en', 'zh-CN', 'ja']);

const FIELD_KINDS = new Set(['shortText', 'longText']);

function validateField(id, field) {
  if (!field || typeof field !== 'object' || Array.isArray(field)) return false;
  if (typeof field.label !== 'string' || field.label.trim() === '') return false;
  if (!FIELD_KINDS.has(field.kind)) return false;
  if (typeof field.group !== 'string' || field.group.trim() === '') return false;
  if (!Number.isInteger(field.order) || field.order < 0) return false;
  if (!Array.isArray(field.preserveTokens)) return false;
  if (!field.values || typeof field.values !== 'object' || Array.isArray(field.values)) return false;
  if (!CONTENT_LOCALES.every((locale) => (
    typeof field.values[locale] === 'string' && field.values[locale].length > 0
  ))) return false;
  return field.preserveTokens.every((token) => (
    typeof token === 'string'
    && token.length > 0
    && CONTENT_LOCALES.every((locale) => field.values[locale].includes(token))
  ));
}

export function validateContentDocument(value) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, errors: ['document'] };
  }
  if (value.schemaVersion !== CONTENT_SCHEMA_VERSION) errors.push('schemaVersion');
  if (typeof value.publishedAt !== 'string' || Number.isNaN(Date.parse(value.publishedAt))) {
    errors.push('publishedAt');
  }
  if (!value.fields || typeof value.fields !== 'object' || Array.isArray(value.fields)) {
    errors.push('fields');
  } else {
    Object.entries(value.fields).forEach(([id, field]) => {
      if (!validateField(id, field)) errors.push(id);
    });
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function mergeContentDocuments(defaults, published) {
  const document = structuredClone(defaults);
  const invalidFieldIds = [];
  if (!published || published.schemaVersion !== CONTENT_SCHEMA_VERSION || !published.fields) {
    return { document, invalidFieldIds: Object.keys(defaults.fields) };
  }

  for (const id of Object.keys(defaults.fields)) {
    const candidate = published.fields[id];
    if (!validateField(id, candidate)) {
      invalidFieldIds.push(id);
      continue;
    }
    document.fields[id] = structuredClone(candidate);
  }
  if (typeof published.publishedAt === 'string' && !Number.isNaN(Date.parse(published.publishedAt))) {
    document.publishedAt = published.publishedAt;
  }
  return { document, invalidFieldIds };
}

export function serializeContentDocument(document) {
  const fields = Object.fromEntries(
    Object.entries(document.fields).sort(([left], [right]) => (
      left < right ? -1 : left > right ? 1 : 0
    )),
  );
  return `${JSON.stringify({ ...document, fields }, null, 2)}\n`;
}
