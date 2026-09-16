import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "raw" / "countries.geojson"
OUTPUT = ROOT / "data" / "country-centroids.js"
US_STATES_SOURCE = ROOT / "data" / "raw" / "us-states.geojson"
POPULATION_SOURCE = ROOT / "data" / "population-reference.js"
SUBDIVISION_OUTPUT = ROOT / "data" / "subdivision-grid.js"


def polygon_center(geometry):
    polygons = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
    best = None
    for polygon in polygons:
        if not polygon or not polygon[0]:
            continue
        longitudes = [point[0] for point in polygon[0]]
        latitudes = [point[1] for point in polygon[0]]
        min_lon, max_lon = min(longitudes), max(longitudes)
        min_lat, max_lat = min(latitudes), max(latitudes)
        candidate = {
            "area": (max_lon - min_lon) * (max_lat - min_lat),
            "lon": round((min_lon + max_lon) / 2, 3),
            "lat": round((min_lat + max_lat) / 2, 3),
        }
        if best is None or candidate["area"] > best["area"]:
            best = candidate
    return [best["lon"], best["lat"]] if best else None


geojson = json.loads(SOURCE.read_text(encoding="utf-8"))
centers = {}
for feature in geojson["features"]:
    code = feature["properties"].get("ISO3166-1-Alpha-2")
    center = polygon_center(feature["geometry"])
    if code and code != "-99" and center:
        centers[code] = center

OUTPUT.write_text(
    "globalThis.COUNTRY_CENTROIDS=" + json.dumps(centers, separators=(",", ":")) + ";\n",
    encoding="utf-8",
)
print(f"Wrote {len(centers)} country centers to {OUTPUT}")

population_text = POPULATION_SOURCE.read_text(encoding="utf-8").strip()
population_data = json.loads(population_text.removeprefix("globalThis.POPULATION_REFERENCE=").removesuffix(";"))
state_by_name = {record[2]: (code, record) for code, record in population_data["states"].items()}
state_geojson = json.loads(US_STATES_SOURCE.read_text(encoding="utf-8"))
us_states = []
for feature in state_geojson["features"]:
    match = state_by_name.get(feature["properties"].get("name"))
    center = polygon_center(feature["geometry"])
    if not match or not center:
        continue
    code, record = match
    us_states.append({
        "code": f"US-{code}",
        "name": record[2],
        "population": record[0],
        "year": record[1],
        "lon": center[0],
        "lat": center[1],
        "type": "U.S. STATE" if code not in {"DC", "PR"} else "U.S. DISTRICT / TERRITORY",
    })

australia_states = [
    {"code": "AU-NSW", "name": "New South Wales", "population": 8641100, "year": 2025, "lon": 147.0, "lat": -32.2, "type": "AUSTRALIAN STATE"},
    {"code": "AU-VIC", "name": "Victoria", "population": 7121900, "year": 2025, "lon": 144.6, "lat": -36.8, "type": "AUSTRALIAN STATE"},
    {"code": "AU-QLD", "name": "Queensland", "population": 5712100, "year": 2025, "lon": 145.0, "lat": -22.4, "type": "AUSTRALIAN STATE"},
    {"code": "AU-SA", "name": "South Australia", "population": 1910600, "year": 2025, "lon": 135.8, "lat": -30.0, "type": "AUSTRALIAN STATE"},
    {"code": "AU-WA", "name": "Western Australia", "population": 3076500, "year": 2025, "lon": 121.0, "lat": -25.6, "type": "AUSTRALIAN STATE"},
    {"code": "AU-TAS", "name": "Tasmania", "population": 579100, "year": 2025, "lon": 146.6, "lat": -42.0, "type": "AUSTRALIAN STATE"},
    {"code": "AU-NT", "name": "Northern Territory", "population": 267500, "year": 2025, "lon": 133.5, "lat": -19.4, "type": "AUSTRALIAN TERRITORY"},
    {"code": "AU-ACT", "name": "Australian Capital Territory", "population": 487200, "year": 2025, "lon": 149.1, "lat": -35.3, "type": "AUSTRALIAN TERRITORY"},
]

subdivisions = {"US": us_states, "AU": australia_states}
SUBDIVISION_OUTPUT.write_text(
    "globalThis.SUBDIVISION_GRID=" + json.dumps(subdivisions, separators=(",", ":")) + ";\n",
    encoding="utf-8",
)
print(f"Wrote {len(us_states)} U.S. and {len(australia_states)} Australian subdivisions to {SUBDIVISION_OUTPUT}")
