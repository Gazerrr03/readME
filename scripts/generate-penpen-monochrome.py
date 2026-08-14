from pathlib import Path

from PIL import Image, ImageChops, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/pets/pen-pen/spritesheet.webp'
OUTPUT = ROOT / 'assets/pets/pen-pen/spritesheet-white.webp'


def main():
    source = Image.open(SOURCE).convert('RGBA')
    luminance = ImageOps.grayscale(source)
    mapped_alpha = luminance.point(lambda value: 112 + int(value * 143 / 255))
    mapped_alpha = ImageChops.multiply(mapped_alpha, source.getchannel('A'))
    monochrome = Image.new('RGBA', source.size, (255, 255, 255, 0))
    monochrome.putalpha(mapped_alpha)
    monochrome.save(OUTPUT, lossless=True, method=6)


if __name__ == '__main__':
    main()
