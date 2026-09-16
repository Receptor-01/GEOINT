"""Build seven static population-density atlas images for the extension."""

from __future__ import annotations

import io
import json
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "population"
SIZE = (1000, 600)
TIME_2020 = "1577836800000"

CONTINENTS = {
    "north-america": (-170, 5, -50, 75),
    "south-america": (-90, -60, -30, 15),
    "europe": (-25, 34, 45, 72),
    "africa": (-25, -38, 60, 38),
    "asia": (25, -10, 180, 80),
    "oceania": (105, -50, 180, 5),
    "antarctica": (-180, -72, 180, -55),
}

RAMP = [
    (0, (5, 7, 18)),
    (18, (21, 28, 103)),
    (45, (36, 76, 200)),
    (75, (0, 184, 221)),
    (110, (80, 227, 111)),
    (145, (255, 226, 69)),
    (185, (255, 135, 28)),
    (220, (244, 42, 22)),
    (255, (255, 47, 175)),
]


def request_image(url: str) -> Image.Image:
    request = urllib.request.Request(url, headers={"User-Agent": "Case-Area-Prep/1.0"})
    with urllib.request.urlopen(request, timeout=120) as response:
        return Image.open(io.BytesIO(response.read())).convert("RGBA")


def interpolate_color(value: int) -> tuple[int, int, int]:
    for index in range(1, len(RAMP)):
        low_value, low_color = RAMP[index - 1]
        high_value, high_color = RAMP[index]
        if value <= high_value:
            ratio = (value - low_value) / max(1, high_value - low_value)
            return tuple(round(low + (high - low) * ratio) for low, high in zip(low_color, high_color))
    return RAMP[-1][1]


def colorize_density(density: Image.Image) -> Image.Image:
    gray = ImageOps.autocontrast(ImageOps.grayscale(density), cutoff=(0.5, 0))
    gray = gray.point(lambda value: 0 if value < 3 else round(255 * (value / 255) ** 0.32))
    expanded = gray.filter(ImageFilter.MaxFilter(3))
    glow = expanded.filter(ImageFilter.GaussianBlur(2.2))
    glow = glow.point(lambda value: min(255, round(value * 1.3)))
    gray = ImageChops.lighter(expanded, glow)
    lookup = [channel for value in range(256) for channel in interpolate_color(value)]
    rgb = gray.convert("RGB").point(lookup)
    alpha = gray.point(lambda value: 0 if value < 8 else min(245, round(78 + value * 0.65)))
    rgb.putalpha(alpha)
    return rgb


def build_image(name: str, bounds: tuple[float, float, float, float]) -> None:
    bbox = ",".join(str(value) for value in bounds)
    common = {
        "bbox": bbox,
        "bboxSR": "4326",
        "imageSR": "4326",
        "size": f"{SIZE[0]},{SIZE[1]}",
        "format": "png32",
        "transparent": "true",
        "f": "image",
    }
    base_url = (
        "https://server.arcgisonline.com/ArcGIS/rest/services/"
        "World_Street_Map/MapServer/export?"
        + urllib.parse.urlencode(common)
    )
    rendering_rule = {
        "rasterFunction": "Stretch",
        "rasterFunctionArguments": {
            "StretchType": 6,
            "DRA": True,
            "Gamma": [0.72],
            "UseGamma": True,
        },
        "outputPixelType": "U8",
    }
    density_parameters = {
        **common,
        "noData": "0",
        "interpolation": "RSP_BilinearInterpolation",
        "renderingRule": json.dumps(rendering_rule, separators=(",", ":")),
        "time": TIME_2020,
    }
    density_url = (
        "https://worldpop.arcgis.com/arcgis/rest/services/"
        "WorldPop_Population_Density_1km/ImageServer/exportImage?"
        + urllib.parse.urlencode(density_parameters)
    )

    base = request_image(base_url).convert("RGB")
    base = ImageEnhance.Color(base).enhance(0.35)
    base = ImageEnhance.Brightness(base).enhance(0.25)
    base = ImageEnhance.Contrast(base).enhance(1.18).convert("RGBA")
    density = colorize_density(request_image(density_url))
    result = Image.alpha_composite(base, density)
    result.save(OUTPUT / f"{name}.png", optimize=True)
    print(f"Built {name}.png")


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, bounds in CONTINENTS.items():
        build_image(name, bounds)


if __name__ == "__main__":
    main()
