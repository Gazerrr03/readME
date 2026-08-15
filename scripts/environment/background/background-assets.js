const assetUrl = (filename) => new URL(`../../../assets/background/${filename}`, import.meta.url).href;

export const DESKTOP_BACKGROUND = Object.freeze({
  id: 'railway-platform-pixel',
  kind: 'image',
  src: assetUrl('railway-platform-pixel.png'),
  alt: '',
  fit: 'cover',
  position: 'center center',
});
