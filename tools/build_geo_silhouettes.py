import json
import math
import re
import unicodedata
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
COUNTRIES_SOURCE = ROOT / "data" / "raw" / "countries.geojson"
COUNTRY_METADATA_SOURCE = ROOT / "data" / "raw" / "countries.json"
STATES_SOURCE = ROOT / "data" / "raw" / "us-states.geojson"
POPULATION_SOURCE = ROOT / "data" / "population-reference.js"
CITY_SOURCE = ROOT / "data" / "city-reference.js"
US_GEONAMES_SOURCE = ROOT / "data" / "raw" / "geonames-US.zip"
OUTPUT = ROOT / "assets" / "geo-silhouettes"
STATE_CODES = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
    "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
    "District of Columbia": "DC", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI",
    "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
    "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
    "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
    "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
    "Oregon": "OR", "Pennsylvania": "PA", "Puerto Rico": "PR", "Rhode Island": "RI",
    "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX",
    "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA",
    "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
}
COUNTRY_CODE_OVERRIDES = {
    "France": "FR",
    "Kosovo": "XK",
    "Norway": "NO",
    "Taiwan": "TW",
}


def read_js_snapshot(path):
    payload = path.read_text(encoding="utf-8").split("=", 1)[1].strip().rstrip(";")
    return json.loads(payload)


def normalize_name(value):
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def build_capital_coordinates():
    population = read_js_snapshot(POPULATION_SOURCE)
    cities = read_js_snapshot(CITY_SOURCE)
    coordinates = {"countries": {}, "states": {}}

    for scope in ("countries", "states"):
        for code, record in population.get(scope, {}).items():
            capital = record[3] if len(record) > 3 else ""
            target = normalize_name(capital)
            if not target:
                continue
            match = next(
                (city for city in cities.get(scope, {}).get(code, []) if normalize_name(city[0]) == target),
                None,
            )
            if match:
                coordinates[scope][code] = (float(match[2]), float(match[3]))

    # The full U.S. GeoNames archive fills in smaller state capitals omitted from
    # the largest-city snapshot (for example Montpelier and Pierre).
    with zipfile.ZipFile(US_GEONAMES_SOURCE) as archive:
        member = next(name for name in archive.namelist() if name.lower().endswith("us.txt"))
        state_targets = {
            (code, normalize_name(record[3])): code
            for code, record in population.get("states", {}).items() if len(record) > 3
        }
        for raw_line in archive.open(member):
            columns = raw_line.decode("utf-8").rstrip("\n").split("\t")
            if len(columns) < 11 or columns[6] != "P":
                continue
            code = columns[10]
            if (code, normalize_name(columns[1])) in state_targets or (code, normalize_name(columns[2])) in state_targets:
                coordinates["states"][code] = (float(columns[4]), float(columns[5]))

    return coordinates


CAPITAL_COORDINATES = build_capital_coordinates()


def polygon_area(ring):
    return abs(sum(
        ring[index][0] * ring[(index + 1) % len(ring)][1]
        - ring[(index + 1) % len(ring)][0] * ring[index][1]
        for index in range(len(ring))
    )) / 2


def geometry_polygons(geometry):
    coordinates = geometry["coordinates"]
    polygons = [coordinates] if geometry["type"] == "Polygon" else coordinates
    largest = max(polygon_area(polygon[0]) for polygon in polygons)
    return [polygon for polygon in polygons if polygon_area(polygon[0]) >= largest * 0.004]


def unwrap_longitudes(polygons):
    longitudes = [point[0] for polygon in polygons for ring in polygon for point in ring]
    if max(longitudes) - min(longitudes) <= 180:
        return polygons
    return [
        [
            [[longitude + 360 if longitude < 0 else longitude, latitude] for longitude, latitude in ring]
            for ring in polygon
        ]
        for polygon in polygons
    ]


def render(geometry, destination, marker=None):
    scale = 3
    width, height = 300 * scale, 180 * scale
    padding = 18 * scale
    polygons = unwrap_longitudes(geometry_polygons(geometry))
    if destination.stem == "FR":
        # The briefing silhouette represents metropolitan France at a useful scale.
        # Keep Corsica, but omit distant overseas departments and territories.
        polygons = [
            polygon for polygon in polygons
            if any(-10 <= point[0] <= 15 and 35 <= point[1] <= 55 for point in polygon[0])
        ]
    points = [point for polygon in polygons for ring in polygon for point in ring]
    min_x, max_x = min(point[0] for point in points), max(point[0] for point in points)
    min_y, max_y = min(point[1] for point in points), max(point[1] for point in points)
    geo_width = max(max_x - min_x, 0.0001)
    geo_height = max(max_y - min_y, 0.0001)
    fit = min((width - padding * 2) / geo_width, (height - padding * 2) / geo_height)
    offset_x = (width - geo_width * fit) / 2
    offset_y = (height - geo_height * fit) / 2

    def project(point):
        return (
            round(offset_x + (point[0] - min_x) * fit),
            round(height - offset_y - (point[1] - min_y) * fit),
        )

    mask = Image.new("L", (width, height), 0)
    mask_draw = ImageDraw.Draw(mask)
    outlines = []
    for polygon in polygons:
        exterior = [project(point) for point in polygon[0]]
        outlines.append(exterior)
        mask_draw.polygon(exterior, fill=255)
        for hole in polygon[1:]:
            mask_draw.polygon([project(point) for point in hole], fill=0)

    image = Image.new("RGBA", (width, height), (2, 3, 3, 255))
    land = Image.new("RGBA", (width, height), (22, 25, 25, 255))
    grid = ImageDraw.Draw(land)
    grid_step = 18 * scale
    for x in range(0, width, grid_step):
        grid.line((x, 0, x, height), fill=(83, 88, 88, 105), width=1 * scale)
    for y in range(0, height, grid_step):
        grid.line((0, y, width, y), fill=(83, 88, 88, 105), width=1 * scale)
    for x in range(-height, width, grid_step * 2):
        grid.line((x, 0, x + height, height), fill=(45, 49, 49, 85), width=1 * scale)
    image.paste(land, (0, 0), mask)

    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    for outline in outlines:
        glow_draw.line(outline + [outline[0]], fill=(255, 70, 0, 235), width=4 * scale, joint="curve")
    image = Image.alpha_composite(image, glow.filter(ImageFilter.GaussianBlur(7 * scale)))

    outline_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    outline_draw = ImageDraw.Draw(outline_layer)
    for outline in outlines:
        outline_draw.line(outline + [outline[0]], fill=(255, 92, 22, 255), width=2 * scale, joint="curve")
        outline_draw.line(outline + [outline[0]], fill=(255, 184, 94, 230), width=1 * scale, joint="curve")
    image = Image.alpha_composite(image, outline_layer)

    if marker:
        latitude, longitude = marker
        marker_x, marker_y = project([longitude, latitude])
        if 0 <= marker_x < width and 0 <= marker_y < height:
            marker_glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            marker_glow_draw = ImageDraw.Draw(marker_glow)
            glow_radius = 7 * scale
            marker_glow_draw.ellipse(
                (marker_x - glow_radius, marker_y - glow_radius, marker_x + glow_radius, marker_y + glow_radius),
                fill=(255, 82, 12, 190),
            )
            image = Image.alpha_composite(image, marker_glow.filter(ImageFilter.GaussianBlur(6 * scale)))
            marker_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            marker_draw = ImageDraw.Draw(marker_layer)
            dot_radius = 2.4 * scale
            marker_draw.ellipse(
                (marker_x - dot_radius, marker_y - dot_radius, marker_x + dot_radius, marker_y + dot_radius),
                fill=(255, 151, 73, 255),
                outline=(255, 222, 188, 255),
                width=scale,
            )
            image = Image.alpha_composite(image, marker_layer)

    image.resize((300, 180), Image.Resampling.LANCZOS).save(destination, optimize=True)


def build_collection(source, destination, code_for, markers=None):
    collection = json.loads(source.read_text(encoding="utf-8"))
    destination.mkdir(parents=True, exist_ok=True)
    count = 0
    for feature in collection["features"]:
        code = code_for(feature["properties"])
        if not code or not feature.get("geometry"):
            continue
        render(feature["geometry"], destination / f"{code}.png", (markers or {}).get(code))
        count += 1
    return count


def render_state_contexts(source, destination):
    collection = json.loads(source.read_text(encoding="utf-8"))
    features = {
        STATE_CODES.get(feature["properties"].get("name")): feature
        for feature in collection["features"]
        if feature.get("geometry") and STATE_CODES.get(feature["properties"].get("name"))
    }
    destination.mkdir(parents=True, exist_ok=True)
    scale = 3
    width, height = 300 * scale, 180 * scale
    main_box = (25 * scale, 15 * scale, 875 * scale / 3, 139 * scale)
    inset_boxes = {
        "AK": (30 * scale, 132 * scale, 92 * scale, 174 * scale),
        "HI": (105 * scale, 145 * scale, 155 * scale, 174 * scale),
        "PR": (213 * scale, 151 * scale, 268 * scale, 171 * scale),
    }

    def rings_for(feature):
        return geometry_polygons(feature["geometry"])

    lower_codes = [code for code in features if code not in {"AK", "HI", "PR"}]
    lower_points = [
        point for code in lower_codes for polygon in rings_for(features[code])
        for ring in polygon for point in ring
    ]
    lower_bounds = (
        min(point[0] for point in lower_points), max(point[0] for point in lower_points),
        min(point[1] for point in lower_points), max(point[1] for point in lower_points),
    )

    def projector(bounds, box):
        min_x, max_x, min_y, max_y = bounds
        left, top, right, bottom = box
        geo_width = max(max_x - min_x, .0001)
        geo_height = max(max_y - min_y, .0001)
        fit = min((right - left) / geo_width, (bottom - top) / geo_height)
        offset_x = left + ((right - left) - geo_width * fit) / 2
        offset_y = top + ((bottom - top) - geo_height * fit) / 2
        return lambda point: (
            round(offset_x + (point[0] - min_x) * fit),
            round(offset_y + (max_y - point[1]) * fit),
        )

    lower_project = projector(lower_bounds, main_box)
    projectors = {code: lower_project for code in lower_codes}
    for code, box in inset_boxes.items():
        if code not in features:
            continue
        points = [point for polygon in rings_for(features[code]) for ring in polygon for point in ring]
        bounds = (
            min(point[0] for point in points), max(point[0] for point in points),
            min(point[1] for point in points), max(point[1] for point in points),
        )
        projectors[code] = projector(bounds, box)

    for selected_code in features:
        image = Image.new("RGBA", (width, height), (2, 3, 3, 255))
        base = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        base_draw = ImageDraw.Draw(base)
        selected_outlines = []

        for code, feature in features.items():
            project = projectors.get(code)
            if not project:
                continue
            for polygon in rings_for(feature):
                exterior = [project(point) for point in polygon[0]]
                fill = (92, 40, 18, 255) if code == selected_code else (19, 22, 22, 255)
                line = (255, 91, 20, 255) if code == selected_code else (70, 74, 74, 210)
                base_draw.polygon(exterior, fill=fill)
                base_draw.line(exterior + [exterior[0]], fill=line, width=(2 if code == selected_code else 1) * scale, joint="curve")
                if code == selected_code:
                    selected_outlines.append(exterior)

        grid_mask = Image.new("L", (width, height), 0)
        grid_mask_draw = ImageDraw.Draw(grid_mask)
        for code, feature in features.items():
            project = projectors.get(code)
            if not project:
                continue
            for polygon in rings_for(feature):
                grid_mask_draw.polygon([project(point) for point in polygon[0]], fill=255)
        grid_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        grid_draw = ImageDraw.Draw(grid_layer)
        for x in range(0, width, 18 * scale):
            grid_draw.line((x, 0, x, height), fill=(82, 87, 87, 90), width=scale)
        for y in range(0, height, 18 * scale):
            grid_draw.line((0, y, width, y), fill=(82, 87, 87, 90), width=scale)
        clipped_grid = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        clipped_grid.paste(grid_layer, (0, 0), grid_mask)
        image = Image.alpha_composite(image, base)
        image = Image.alpha_composite(image, clipped_grid)

        glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow)
        for outline in selected_outlines:
            glow_draw.line(outline + [outline[0]], fill=(255, 72, 0, 240), width=5 * scale, joint="curve")
        image = Image.alpha_composite(image, glow.filter(ImageFilter.GaussianBlur(7 * scale)))

        highlight = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        highlight_draw = ImageDraw.Draw(highlight)
        for outline in selected_outlines:
            highlight_draw.line(outline + [outline[0]], fill=(255, 175, 86, 255), width=scale, joint="curve")
        image = Image.alpha_composite(image, highlight)
        image.resize((300, 180), Image.Resampling.LANCZOS).save(destination / f"{selected_code}.png", optimize=True)

    return len(features)


def render_country_contexts(source, metadata_source, destination):
    collection = json.loads(source.read_text(encoding="utf-8"))
    metadata = json.loads(metadata_source.read_text(encoding="utf-8"))
    continent_by_code = {}
    for country in metadata:
        code = country.get("cca2")
        region = country.get("region") or "World"
        subregion = country.get("subregion") or ""
        if region == "Americas":
            region = "South America" if subregion == "South America" else "North America"
        if code:
            continent_by_code[code] = region

    def feature_code(feature):
        properties = feature["properties"]
        return COUNTRY_CODE_OVERRIDES.get(properties.get("name")) or properties.get("ISO3166-1-Alpha-2")

    features = {
        feature_code(feature): feature
        for feature in collection["features"]
        if feature.get("geometry") and feature_code(feature)
    }
    continent_by_code.setdefault("XK", "Europe")
    groups = {}
    for code, feature in features.items():
        continent = continent_by_code.get(code, "World")
        groups.setdefault(continent, {})[code] = feature

    destination.mkdir(parents=True, exist_ok=True)
    scale = 3
    width, height = 300 * scale, 180 * scale
    box = (18 * scale, 12 * scale, 282 * scale, 168 * scale)
    continent_bounds = {
        "Africa": (-20, 55, -38, 38),
        "Asia": (25, 180, -12, 80),
        "Europe": (-25, 45, 34, 72),
        "North America": (-180, -20, 5, 85),
        "South America": (-95, -25, -60, 15),
        "Oceania": (110, 290, -55, 30),
        "Antarctic": (-180, 180, -90, -60),
    }

    def normalize_point(point, continent):
        longitude, latitude = point
        if continent == "Oceania" and longitude < 0:
            longitude += 360
        return [longitude, latitude]

    def normalized_polygons(feature, continent):
        return [
            [[normalize_point(point, continent) for point in ring] for ring in polygon]
            for polygon in geometry_polygons(feature["geometry"])
        ]

    def projector(bounds):
        min_x, max_x, min_y, max_y = bounds
        left, top, right, bottom = box
        geo_width = max(max_x - min_x, .0001)
        geo_height = max(max_y - min_y, .0001)
        fit = min((right - left) / geo_width, (bottom - top) / geo_height)
        offset_x = left + ((right - left) - geo_width * fit) / 2
        offset_y = top + ((bottom - top) - geo_height * fit) / 2
        return lambda point: (
            round(offset_x + (point[0] - min_x) * fit),
            round(offset_y + (max_y - point[1]) * fit),
        )

    rendered = 0
    for continent, continent_features in groups.items():
        polygons_by_code = {
            code: normalized_polygons(feature, continent)
            for code, feature in continent_features.items()
        }
        points = [
            point for polygons in polygons_by_code.values()
            for polygon in polygons for ring in polygon for point in ring
        ]
        if not points:
            continue
        calculated_bounds = (
            min(point[0] for point in points), max(point[0] for point in points),
            min(point[1] for point in points), max(point[1] for point in points),
        )
        bounds = continent_bounds.get(continent, calculated_bounds)
        project = projector(bounds)

        for selected_code in continent_features:
            image = Image.new("RGBA", (width, height), (2, 3, 3, 255))
            base = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            base_draw = ImageDraw.Draw(base)
            land_mask = Image.new("L", (width, height), 0)
            land_mask_draw = ImageDraw.Draw(land_mask)
            selected_outlines = []

            for code, polygons in polygons_by_code.items():
                for polygon in polygons:
                    exterior = [project(point) for point in polygon[0]]
                    fill = (92, 40, 18, 255) if code == selected_code else (19, 22, 22, 255)
                    line = (255, 91, 20, 255) if code == selected_code else (70, 74, 74, 210)
                    base_draw.polygon(exterior, fill=fill)
                    base_draw.line(exterior + [exterior[0]], fill=line, width=(2 if code == selected_code else 1) * scale, joint="curve")
                    land_mask_draw.polygon(exterior, fill=255)
                    if code == selected_code:
                        selected_outlines.append(exterior)

            grid_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            grid_draw = ImageDraw.Draw(grid_layer)
            for x in range(0, width, 18 * scale):
                grid_draw.line((x, 0, x, height), fill=(82, 87, 87, 90), width=scale)
            for y in range(0, height, 18 * scale):
                grid_draw.line((0, y, width, y), fill=(82, 87, 87, 90), width=scale)
            clipped_grid = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            clipped_grid.paste(grid_layer, (0, 0), land_mask)
            image = Image.alpha_composite(image, base)
            image = Image.alpha_composite(image, clipped_grid)

            glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            glow_draw = ImageDraw.Draw(glow)
            for outline in selected_outlines:
                glow_draw.line(outline + [outline[0]], fill=(255, 72, 0, 245), width=6 * scale, joint="curve")
            image = Image.alpha_composite(image, glow.filter(ImageFilter.GaussianBlur(8 * scale)))

            highlight = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            highlight_draw = ImageDraw.Draw(highlight)
            for outline in selected_outlines:
                highlight_draw.line(outline + [outline[0]], fill=(255, 182, 96, 255), width=scale, joint="curve")
            image = Image.alpha_composite(image, highlight)
            image.resize((300, 180), Image.Resampling.LANCZOS).save(destination / f"{selected_code}.png", optimize=True)
            rendered += 1

    return rendered


def render_hemisphere_globes(destination):
    destination.mkdir(parents=True, exist_ok=True)
    scale = 3
    width, height = 300 * scale, 180 * scale
    center_x, center_y = width // 2, height // 2
    radius = 72 * scale
    globe_box = (center_x - radius, center_y - radius, center_x + radius, center_y + radius)

    for vertical in ("N", "S"):
        for horizontal in ("E", "W"):
            image = Image.new("RGBA", (width, height), (2, 3, 3, 255))
            backdrop = ImageDraw.Draw(image)
            for x in range(0, width, 18 * scale):
                backdrop.line((x, 0, x, height), fill=(37, 41, 41, 90), width=scale)
            for y in range(0, height, 18 * scale):
                backdrop.line((0, y, width, y), fill=(37, 41, 41, 90), width=scale)

            globe_mask = Image.new("L", (width, height), 0)
            ImageDraw.Draw(globe_mask).ellipse(globe_box, fill=255)
            globe = Image.new("RGBA", (width, height), (38, 42, 42, 255))
            image.paste(globe, (0, 0), globe_mask)

            active_tint = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            active_draw = ImageDraw.Draw(active_tint)
            active_left = center_x if horizontal == "E" else center_x - radius
            active_right = center_x + radius if horizontal == "E" else center_x
            active_top = center_y - radius if vertical == "N" else center_y
            active_bottom = center_y if vertical == "N" else center_y + radius
            active_draw.rectangle(
                (active_left, active_top, active_right, active_bottom),
                fill=(255, 82, 10, 218),
            )
            clipped_tint = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            clipped_tint.paste(active_tint, (0, 0), globe_mask)
            image = Image.alpha_composite(image, clipped_tint)

            glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            glow_draw = ImageDraw.Draw(glow)
            glow_draw.ellipse(globe_box, outline=(255, 80, 10, 230), width=4 * scale)
            image = Image.alpha_composite(image, glow.filter(ImageFilter.GaussianBlur(7 * scale)))

            lines = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            line_draw = ImageDraw.Draw(lines)
            line_draw.ellipse(globe_box, outline=(255, 118, 47, 255), width=2 * scale)
            line_draw.line((center_x - radius, center_y, center_x + radius, center_y), fill=(109, 115, 115, 220), width=scale)
            line_draw.line((center_x, center_y - radius, center_x, center_y + radius), fill=(109, 115, 115, 220), width=scale)
            for meridian_width in (36, 82):
                half_width = meridian_width * scale
                line_draw.ellipse((center_x - half_width, center_y - radius, center_x + half_width, center_y + radius), outline=(66, 72, 72, 175), width=scale)
            for latitude_height in (30, 70):
                half_height = latitude_height * scale
                line_draw.ellipse((center_x - radius, center_y - half_height, center_x + radius, center_y + half_height), outline=(66, 72, 72, 155), width=scale)
            image = Image.alpha_composite(image, lines)
            image.resize((300, 180), Image.Resampling.LANCZOS).save(destination / f"{vertical}{horizontal}.png", optimize=True)

    return 4


country_count = build_collection(
    COUNTRIES_SOURCE,
    OUTPUT / "countries",
    lambda properties: COUNTRY_CODE_OVERRIDES.get(properties.get("name"))
    or properties.get("ISO3166-1-Alpha-2"),
    CAPITAL_COORDINATES["countries"],
)
state_count = build_collection(
    STATES_SOURCE,
    OUTPUT / "states",
    lambda properties: STATE_CODES.get(properties.get("name")),
    CAPITAL_COORDINATES["states"],
)
state_context_count = render_state_contexts(STATES_SOURCE, OUTPUT / "state-context")
country_context_count = render_country_contexts(COUNTRIES_SOURCE, COUNTRY_METADATA_SOURCE, OUTPUT / "country-context")
hemisphere_count = render_hemisphere_globes(OUTPUT / "hemispheres")
print(f"Rendered {country_count} country, {state_count} state silhouette, {state_context_count} state context, {country_context_count} country context, and {hemisphere_count} hemisphere PNGs.")
