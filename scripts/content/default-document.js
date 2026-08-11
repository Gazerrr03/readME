import { photos, tracks } from '../../media/catalog.js';
import { about, articles, channels, projects } from '../data/content.js';
import { dictionaries } from '../i18n/dictionaries.js';
import { CONTENT_SCHEMA_VERSION } from './content-document.js';

const LOCALES = ['en', 'zh-CN', 'ja'];
const tokensIn = (values) => [...new Set(LOCALES.flatMap((locale) => (
  values[locale].match(/\{[^{}]+\}/g) ?? []
)))].filter((token) => LOCALES.every((locale) => values[locale].includes(token)));

const localized = (source) => Object.fromEntries(LOCALES.map((locale) => [locale, source[locale]]));
const literal = (value) => Object.fromEntries(LOCALES.map((locale) => [locale, String(value)]));
const blockText = (item) => {
  if (typeof item === 'string') return item;
  return item.h ?? item.a ?? '';
};

function field(label, group, order, values, kind = 'shortText') {
  return {
    label,
    kind,
    group,
    order,
    preserveTokens: tokensIn(values),
    values,
  };
}

function add(fields, id, label, group, order, values, kind) {
  fields[id] = field(label, group, order, values, kind);
}

function dictionaryGroup(key) {
  if (/^(photos|player|windows)\./.test(key)) return 'advanced.accessibility';
  if (/^(desktop|boot|bot|protocol|language|environment|deck|nav|settings)\./.test(key)) {
    return 'advanced.interface';
  }
  return 'advanced.interface';
}

export function createDefaultContentDocument() {
  const fields = {};
  let order = 0;
  Object.keys(dictionaries.en).forEach((key) => {
    const values = Object.fromEntries(LOCALES.map((locale) => [locale, dictionaries[locale][key]]));
    add(fields, `ui.${key}`, `${dictionaries['zh-CN'][key]} · ${key}`, dictionaryGroup(key), order, values);
    order += 1;
  });

  projects.forEach((project) => {
    const prefix = `projects.${project.slug}`;
    add(fields, `${prefix}.title`, `${project.slug} · 标题`, 'projects', order++, localized(project.title));
    add(fields, `${prefix}.description`, `${project.slug} · 描述`, 'projects', order++, localized(project.description), 'longText');
    for (const [key, value] of [['kind', project.kind], ['year', project.year], ['status', project.status], ['stack', project.stack]]) {
      add(fields, `${prefix}.${key}`, `${project.slug} · ${key}`, 'projects', order++, literal(value));
    }
  });

  articles.forEach((article) => {
    const prefix = `articles.${article.slug}`;
    add(fields, `${prefix}.title`, `${article.slug} · 标题`, 'articles', order++, localized(article.title));
    add(fields, `${prefix}.date`, `${article.slug} · 日期`, 'articles', order++, literal(article.date));
    add(fields, `${prefix}.tag`, `${article.slug} · 标签`, 'articles', order++, literal(article.tag));
    const blockCount = article.body['zh-CN'].length;
    for (let index = 0; index < blockCount; index += 1) {
      const blockId = `block-${String(index + 1).padStart(3, '0')}`;
      const items = Object.fromEntries(LOCALES.map((locale) => [locale, article.body[locale][index]]));
      const values = Object.fromEntries(LOCALES.map((locale) => [locale, blockText(items[locale])]));
      const isHeading = LOCALES.every((locale) => typeof items[locale] === 'object' && items[locale].h);
      add(fields, `${prefix}.body.${blockId}.text`, `${article.slug} · 正文 ${index + 1}`, 'articles', order++, values, isHeading ? 'shortText' : 'longText');
      if (LOCALES.every((locale) => typeof items[locale] === 'object' && items[locale].rest)) {
        add(fields, `${prefix}.body.${blockId}.rest`, `${article.slug} · 链接后文本 ${index + 1}`, 'articles', order++, Object.fromEntries(
          LOCALES.map((locale) => [locale, items[locale].rest]),
        ), 'longText');
      }
    }
  });

  add(fields, 'about.name', '关于 · 姓名', 'about', order++, literal(about.name));
  add(fields, 'about.role', '关于 · 身份', 'about', order++, localized(about.role));
  add(fields, 'about.bio', '关于 · 自述', 'about', order++, localized(about.bio), 'longText');
  about.timeline.forEach((entry, index) => {
    const prefix = `about.timeline.entry-${String(index + 1).padStart(2, '0')}`;
    add(fields, `${prefix}.year`, `时间线 ${index + 1} · 年份`, 'about', order++, literal(entry.year));
    add(fields, `${prefix}.event`, `时间线 ${index + 1} · 事件`, 'about', order++, localized(entry.event));
  });
  about.stack.forEach((value, index) => {
    add(fields, `about.stack.item-${String(index + 1).padStart(2, '0')}`, `技能栈 ${index + 1}`, 'about', order++, literal(value));
  });
  about.now.forEach((entry, index) => {
    const prefix = `about.now.entry-${String(index + 1).padStart(2, '0')}`;
    add(fields, `${prefix}.key`, `当前 ${index + 1} · 标签`, 'about', order++, literal(entry.key));
    add(fields, `${prefix}.value`, `当前 ${index + 1} · 内容`, 'about', order++, localized(entry.value));
  });

  channels.forEach((channel) => {
    for (const key of ['channel', 'address', 'status']) {
      add(fields, `contact.${channel.id}.${key}`, `${channel.id} · ${key}`, 'contact', order++, literal(channel[key]));
    }
  });

  photos.forEach((photo) => {
    add(fields, `media.photos.${photo.slug}.title`, `${photo.slug} · 照片标题`, 'photos', order++, localized(photo.title));
    add(fields, `media.photos.${photo.slug}.date`, `${photo.slug} · 照片日期`, 'photos', order++, literal(photo.date));
  });
  tracks.forEach((track) => {
    add(fields, `media.tracks.${track.slug}.title`, `${track.slug} · 唱片标题`, 'albums', order++, localized(track.title));
    add(fields, `media.tracks.${track.slug}.format`, `${track.slug} · 音频格式`, 'albums', order++, literal(track.format));
  });

  return {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    publishedAt: '2026-08-12T00:00:00.000Z',
    fields,
  };
}

export const defaultContentDocument = createDefaultContentDocument();
