const CONTENT_KINDS = new Set(['writing', 'projects']);
const CONTENT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertKind(kind) {
  if (!CONTENT_KINDS.has(kind)) {
    throw new TypeError(`Unsupported content kind: ${kind}`);
  }
}

function assertSlug(slug) {
  if (typeof slug !== 'string' || !CONTENT_SLUG.test(slug)) {
    throw new TypeError(`Invalid content slug: ${slug}`);
  }
}

export function contentPath(kind, slug) {
  assertKind(kind);
  assertSlug(slug);
  return `${kind}/${slug}/`;
}

export function desktopPath(kind) {
  assertKind(kind);
  return `?open=${kind}`;
}

export function readDesktopTarget(search = '') {
  const kind = new URLSearchParams(search).get('open');
  return CONTENT_KINDS.has(kind) ? kind : null;
}
