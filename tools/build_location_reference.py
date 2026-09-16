import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COUNTRIES = json.loads((ROOT / "data" / "raw" / "countries.json").read_text(encoding="utf-8"))
STATES = json.loads((ROOT / "data" / "raw" / "us-states.geojson").read_text(encoding="utf-8"))
OUTPUT = ROOT / "data" / "location-reference.js"
STATE_CODES = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "District of Columbia": "DC",
    "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL",
    "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA",
    "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI",
    "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT",
    "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
    "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA",
    "Puerto Rico": "PR", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
    "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA",
    "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
}


def normalize(value):
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def all_points(value):
    if value and isinstance(value[0], (int, float)):
        yield value
    else:
        for item in value:
            yield from all_points(item)


reference = {}
for country in COUNTRIES:
    code = country.get("cca2")
    latlng = country.get("latlng")
    if not code or not latlng:
        continue
    common = country["name"]["common"]
    record = [latlng[0], latlng[1], code, common, "", ""]
    aliases = {common, country["name"].get("official", ""), code, *country.get("altSpellings", [])}
    for alias in aliases:
        if alias:
            reference[normalize(alias)] = record

for feature in STATES["features"]:
    name = feature["properties"].get("name")
    code = STATE_CODES.get(name)
    if not code:
        continue
    points = list(all_points(feature["geometry"]["coordinates"]))
    longitudes = [point[0] for point in points]
    latitudes = [point[1] for point in points]
    record = [
        (min(latitudes) + max(latitudes)) / 2,
        (min(longitudes) + max(longitudes)) / 2,
        "US",
        "United States",
        f"US-{code}",
        name,
    ]
    reference[normalize(name)] = record
    reference[normalize(f"{name} usa")] = record
    reference[normalize(f"{name} united states")] = record

payload = json.dumps(dict(sorted(reference.items())), ensure_ascii=False, separators=(",", ":"))
OUTPUT.write_text(
    "// Bundled direct country/state lookup used before network geocoding.\n"
    f"globalThis.LOCATION_REFERENCE={payload};\n",
    encoding="utf-8",
)
print(f"Wrote {len(reference)} direct location aliases.")
