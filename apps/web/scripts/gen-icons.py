"""Generate PWA + touch icons for Wachaut (mark: gradient amber on black).

Run: python scripts/gen-icons.py  (from apps/web)
Outputs: static/icons/{icon-192,icon-512,maskable-192,maskable-512}.png
         static/brand-marks/apple-touch-icon.png (180×180)
"""
from pathlib import Path
from PIL import Image, ImageDraw

STOPS = [(0.0, (0xFC, 0xD3, 0x4D)), (0.55, (0xFF, 0xB3, 0x00)), (1.0, (0xD9, 0x94, 0x00))]


def grad(t: float):
    for (t0, c0), (t1, c1) in zip(STOPS, STOPS[1:]):
        if t <= t1:
            f = 0 if t1 == t0 else (t - t0) / (t1 - t0)
            return tuple(round(c0[i] + (c1[i] - c0[i]) * f) for i in range(3))
    return STOPS[-1][1]


def mark_mask(W: int) -> Image.Image:
    """The Wachaut mark as a grayscale mask at W×W (supersampled 4×)."""
    SS = 4
    img = Image.new('L', (W * SS, W * SS), 0)
    d = ImageDraw.Draw(img)
    S = W * SS / 48.0

    def rounded_ring(rect, r, width):
        x0, y0, x1, y1 = (v * S for v in rect)
        d.rounded_rectangle([x0, y0, x1, y1], radius=r * S, outline=255, width=int(round(width * S)))

    rounded_ring((8, 11, 40, 31), 4.5, 3)  # screen outline
    for ax, ay, bx, by in [(19, 37, 29, 37), (24, 31, 24, 37)]:  # stand
        d.line([ax * S, ay * S, bx * S, by * S], fill=255, width=int(round(3 * S)))
        for cx, cy in [(ax * S, ay * S), (bx * S, by * S)]:
            r = 1.5 * S
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    cx, cy, r = 24 * S, 21 * S, 4 * S  # center dot
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    r = 7 * S  # radar arc, 0.7 opacity ≈ gray 178
    d.arc([cx - r, cy - r, cx + r, cy + r], 180, 360, fill=178, width=int(round(2.4 * S)))

    return img.resize((W, W), Image.LANCZOS)


def gradient_overlay(W: int) -> Image.Image:
    img = Image.new('RGB', (W, W))
    lut = [grad((x + y) / (2 * W - 2)) for x in range(W) for y in range(W)]
    img.putdata(lut)
    return img


def paint(mask: Image.Image) -> Image.Image:
    out = Image.new('RGBA', mask.size, (0, 0, 0, 0))
    out.paste(gradient_overlay(mask.size[0]), (0, 0), mask)
    return out


def sprite(mark_frac: float, final: int) -> Image.Image:
    """Mark centred on opaque black at final×final; mark occupies mark_frac of canvas."""
    W = final * 8
    mark = mark_mask(int(W * mark_frac))
    mark = paint(mark)
    canvas = Image.new('RGBA', (W, W), (0, 0, 0, 255))
    off = ((W - mark.size[0]) // 2, (W - mark.size[1]) // 2)
    canvas.paste(mark, off, mark)
    canvas = canvas.resize((final, final), Image.LANCZOS).convert('RGB')
    return canvas


out_dir = Path('static/icons')
out_dir.mkdir(parents=True, exist_ok=True)

# Manifest icons (any): full-bleed black, mark 72%
for size in (192, 512):
    sprite(0.72, size).save(out_dir / f'icon-{size}.png')
# Maskable: mark well inside the 80% safe zone (56%)
for size in (192, 512):
    sprite(0.56, size).save(out_dir / f'maskable-{size}.png')
# iOS touch icon: opaque, mark 64%
sprite(0.64, 180).save('static/brand-marks/apple-touch-icon.png')

print('icons written:', *sorted(p.name for p in out_dir.iterdir()), 'apple-touch-icon.png')
