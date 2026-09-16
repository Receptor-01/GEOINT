import json
import zipfile
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "raw" / "cities15000.zip"
OUTPUT = ROOT / "data" / "city-reference.js"
LIMIT = 50
EXCLUDED_US_CITY_SECTIONS = {"Bronx", "The Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"}

countries = {}
states = {}

with zipfile.ZipFile(SOURCE) as archive:
    member = next(name for name in archive.namelist() if name.endswith(".txt"))
    for raw_line in archive.open(member):
        fields = raw_line.decode("utf-8").rstrip("\n").split("\t")
        if len(fields) < 19 or fields[6] != "P":
            continue
        name = fields[1].strip()
        country = fields[8].strip().upper()
        state = fields[10].strip().upper()
        population = int(fields[14] or 0)
        if not name or not country or population <= 0:
            continue
        if country == "US" and name in EXCLUDED_US_CITY_SECTIONS:
            continue
        record = [name, population, fields[4], fields[5], fields[18]]
        countries.setdefault(country, []).append(record)
        if country == "US" and len(state) == 2:
            states.setdefault(state, []).append(record)

for collection in (countries, states):
    for code, records in collection.items():
        records.sort(key=lambda record: (-record[1], record[0]))
        seen = set()
        collection[code] = [
            record for record in records
            if not (record[0].casefold() in seen or seen.add(record[0].casefold()))
        ][:LIMIT]

snapshot = {
    "asOf": date.today().isoformat(),
    "countries": dict(sorted(countries.items())),
    "states": dict(sorted(states.items())),
}
payload = json.dumps(snapshot, ensure_ascii=False, separators=(",", ":"))
OUTPUT.write_text(
    "// Dated offline largest-city snapshot generated from GeoNames cities15000.\n"
    f"globalThis.CITY_REFERENCE={payload};\n",
    encoding="utf-8",
)
print(f"Wrote city rankings for {len(countries)} countries and {len(states)} U.S. states.")
