#!/usr/bin/env python3
"""Generate icon PNGs for InstaPump Safari Extension"""

from PIL import Image, ImageDraw, ImageFont
import os

out_dir = os.path.dirname(os.path.abspath(__file__)) + '/images'
sizes = [16, 32, 48, 64, 96, 128, 256, 512]

for size in sizes:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    corner_radius = int(size * 0.22)

    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            r = int(131 + (252 - 131) * t)
            g = int(58 + (176 - 58) * t)
            b = int(180 + (69 - 180) * t)

            dx = min(x, size - 1 - x)
            dy = min(y, size - 1 - y)
            if dx < corner_radius and dy < corner_radius:
                dist = ((corner_radius - dx)**2 + (corner_radius - dy)**2)**0.5
                if dist > corner_radius:
                    continue
            img.putpixel((x, y), (r, g, b, 255))

    if size >= 32:
        try:
            font_size = int(size * 0.45)
            font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', font_size)
        except:
            font = ImageFont.load_default()

        text = 'IP'
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = (size - tw) // 2
        ty = (size - th) // 2 - int(size * 0.05)
        draw.text((tx, ty), text, fill='white', font=font)

    img.save(f'{out_dir}/icon-{size}.png')
    print(f'Created icon-{size}.png')

print('Done!')
