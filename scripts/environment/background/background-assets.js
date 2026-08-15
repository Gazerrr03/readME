const assetUrl = (filename) => new URL(`../../../assets/background/${filename}`, import.meta.url).href;

export const DESKTOP_BACKGROUND = Object.freeze({
  id: 'aquarium-lab-pixel',
  kind: 'image',
  src: assetUrl('aquarium-lab-pixel.png'),
  alt: '',
  fit: 'cover',
  position: 'center center',
});
