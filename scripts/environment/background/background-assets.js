const assetUrl = (filename) => new URL(`../../../assets/background/${filename}`, import.meta.url).href;

export const DESKTOP_BACKGROUND = Object.freeze({
  id: 'storm-clouds-pixel',
  kind: 'image',
  src: assetUrl('storm-clouds-pixel.png'),
  alt: '',
  fit: 'cover',
  position: 'center center',
});
