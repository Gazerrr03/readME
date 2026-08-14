/*
 * The interactive folders are deliberately backed by independent manifests.
 * Add uploaded EPUB/PDF files to BOOKS and self-contained HTML games to GAMES;
 * neither collection should borrow content from the writing archive.
 *
 * Book shape:
 * { slug, title: { en, 'zh-CN', ja }, description: { en, 'zh-CN', ja },
 *   author, year, format, file }
 * Game shape:
 * { slug, title: { en, 'zh-CN', ja }, description, file }
 */
export const BOOKS = Object.freeze([]);
export const GAMES = Object.freeze([]);
