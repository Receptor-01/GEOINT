import csv
import io
import json
import urllib.request
import zipfile
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BEA_ARCHIVE = ROOT / "data" / "raw" / "SAGDP.zip"
COUNTRY_SOURCE = ROOT / "data" / "raw" / "countries.json"
OUTPUT = ROOT / "data" / "gdp-reference.js"
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
    "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN",
    "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA",
    "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
}

valid_countries = {
    country["cca2"]
    for country in json.loads(COUNTRY_SOURCE.read_text(encoding="utf-8"))
    if country.get("cca2")
}
request = urllib.request.Request(
    "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD"
    "?format=json&per_page=2000&date=2019:2025",
    headers={"User-Agent": "CaseAreaPrep/0.1 offline-snapshot-builder"},
)
with urllib.request.urlopen(request, timeout=60) as response:
    world_bank = json.load(response)

country_history = {}
for record in world_bank[1]:
    code = record.get("country", {}).get("id")
    value = record.get("value")
    if code not in valid_countries or value is None:
        continue
    country_history.setdefault(code, []).append([int(record["date"]), round(float(value))])

countries = {}
for code, history in country_history.items():
    history.sort(key=lambda item: item[0])
    latest_year, latest_value = history[-1]
    country_name = next(
        (record["country"]["value"] for record in world_bank[1] if record.get("country", {}).get("id") == code),
        code,
    )
    countries[code] = [latest_value, latest_year, country_name, "WORLD BANK"]

with zipfile.ZipFile(BEA_ARCHIVE) as archive:
    member = next(name for name in archive.namelist() if name.startswith("SAGDP1__ALL_AREAS_"))
    content = archive.read(member).decode("utf-8-sig")

rows = csv.DictReader(io.StringIO(content))
years = [field for field in rows.fieldnames if field.isdigit()]
latest_year = max(years, key=int)
states = {}
state_history = {}
for row in rows:
    if row["LineCode"] != "3":
        continue
    name = row["GeoName"].strip().rstrip(" *")
    code = STATE_CODES.get(name)
    raw_value = row.get(latest_year, "").replace(",", "").strip()
    if not code or not raw_value or raw_value == "(NA)":
        continue
    states[code] = [
        round(float(raw_value) * 1_000_000), int(latest_year), name, "U.S. BEA"
    ]
    state_history[code] = [
        [int(year), round(float(row[year].replace(",", "").strip()) * 1_000_000)]
        for year in years if 2019 <= int(year) <= 2025
        and row.get(year, "").replace(",", "").strip() not in {"", "(NA)"}
    ]

snapshot = {
    "asOf": date.today().isoformat(),
    "countries": dict(sorted(countries.items())),
    "states": dict(sorted(states.items())),
    "history": {
        "countries": dict(sorted(country_history.items())),
        "states": dict(sorted(state_history.items())),
    },
}
payload = json.dumps(snapshot, ensure_ascii=False, separators=(",", ":"))
OUTPUT.write_text(
    "// Dated offline nominal GDP snapshot. Regenerate with tools/build_gdp_reference.py.\n"
    f"globalThis.GDP_REFERENCE={payload};\n",
    encoding="utf-8",
)
print(f"Wrote {len(countries)} country and {len(states)} state GDP records.")
