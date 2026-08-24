import { photos as basePhotos, tracks as baseTracks } from '../../media/catalog.js';
import { about as baseAbout } from '../../modules/base-buttons/about/data.js';
import { channels as baseChannels } from '../../modules/base-buttons/contact/data.js';
import { articles as baseArticles, projects as baseProjects } from '../data/content.js';
import { dictionaries as baseDictionaries } from '../i18n/dictionaries.js';

const LOCALES = ['en', 'zh-CN', 'ja'];
const valuesAt = (document, id) => structuredClone(document.fields[id].values);
const blockText = (item, text, rest) => {
  if (!item) return item;
  if (typeof item === 'string') return text;
  if (item.h) return { ...item, h: text };
  if (item.q) return { ...item, q: text };
  if (item.a) return { ...item, a: text, ...(item.rest ? { rest } : {}) };
  return item;
};

export function materializeContent(document) {
  const dictionaries = Object.fromEntries(LOCALES.map((locale) => [locale, Object.fromEntries(
    Object.keys(baseDictionaries.en).map((key) => [
      key,
      document.fields[`ui.${key}`]?.values[locale] ?? baseDictionaries[locale][key],
    ]),
  )]));

  const projects = baseProjects.map((project) => {
    const prefix = `projects.${project.slug}`;
    return {
      ...project,
      title: valuesAt(document, `${prefix}.title`),
      description: valuesAt(document, `${prefix}.description`),
      kindLabel: valuesAt(document, `${prefix}.kind`),
      yearLabel: valuesAt(document, `${prefix}.year`),
      statusLabel: valuesAt(document, `${prefix}.status`),
      stackLabel: valuesAt(document, `${prefix}.stack`),
    };
  });

  const articles = baseArticles.map((article) => {
    const prefix = `articles.${article.slug}`;
    const body = Object.fromEntries(LOCALES.map((locale) => [locale, article.body[locale].map(
      (item, index) => {
        const blockId = `block-${String(index + 1).padStart(3, '0')}`;
        const textField = document.fields[`${prefix}.body.${blockId}.text`];
        const text = textField?.values[locale] ?? blockText(item);
        const restField = document.fields[`${prefix}.body.${blockId}.rest`];
        return blockText(item, text, restField?.values[locale]);
      },
    )]));
    return {
      ...article,
      title: valuesAt(document, `${prefix}.title`),
      dateLabel: valuesAt(document, `${prefix}.date`),
      tagLabel: valuesAt(document, `${prefix}.tag`),
      body,
    };
  });

  const about = {
    ...baseAbout,
    nameLabel: valuesAt(document, 'about.name'),
    role: valuesAt(document, 'about.role'),
    bio: valuesAt(document, 'about.bio'),
    experience: baseAbout.experience.map((entry, index) => {
      const prefix = `about.experience.entry-${String(index + 1).padStart(2, '0')}`;
      return {
        ...entry,
        label: valuesAt(document, `${prefix}.label`),
      };
    }),
    works: baseAbout.works.map((entry, index) => {
      const prefix = `about.works.entry-${String(index + 1).padStart(2, '0')}`;
      return {
        ...entry,
        nameLabel: valuesAt(document, `${prefix}.name`),
        meta: valuesAt(document, `${prefix}.meta`),
        description: valuesAt(document, `${prefix}.description`),
      };
    }),
    toolbox: baseAbout.toolbox.map((value, index) => valuesAt(
      document, `about.toolbox.item-${String(index + 1).padStart(2, '0')}`,
    )),
    now: baseAbout.now.map((entry, index) => {
      const prefix = `about.now.entry-${String(index + 1).padStart(2, '0')}`;
      return {
        ...entry,
        key: valuesAt(document, `${prefix}.key`),
        value: valuesAt(document, `${prefix}.value`),
      };
    }),
  };

  const channels = baseChannels.map((channel) => ({
    ...channel,
    channelLabel: valuesAt(document, `contact.${channel.id}.channel`),
    addressLabel: valuesAt(document, `contact.${channel.id}.address`),
    statusLabel: valuesAt(document, `contact.${channel.id}.status`),
  }));
  const photos = basePhotos.map((photo) => ({
    ...photo,
    title: valuesAt(document, `media.photos.${photo.slug}.title`),
    dateLabel: valuesAt(document, `media.photos.${photo.slug}.date`),
  }));
  const tracks = baseTracks.map((track) => ({
    ...track,
    title: valuesAt(document, `media.tracks.${track.slug}.title`),
    formatLabel: valuesAt(document, `media.tracks.${track.slug}.format`),
  }));

  return { dictionaries, projects, articles, about, channels, photos, tracks };
}
