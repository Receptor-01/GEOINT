import csv
import json
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUTPUT = ROOT / "data" / "california-county-reference.js"

coordinates = defaultdict(list)
with (RAW / "geonames-US" / "US.txt").open(encoding="utf-8") as handle:
    for row in csv.reader(handle, delimiter="\t"):
        if len(row) < 12 or row[4] != "CA" or not row[5]:
            continue
        coordinates[row[5].strip()].append((float(row[9]), float(row[10])))

counties = {}
with (RAW / "co-est2025-alldata.csv").open(encoding="cp1252", newline="") as handle:
    for row in csv.DictReader(handle):
        if row["SUMLEV"] != "050" or row["STATE"] != "06":
            continue
        full_name = row["CTYNAME"].strip()
        short_name = full_name.removesuffix(" County")
        coordinate_name = "City and County of San Francisco" if short_name == "San Francisco" else short_name
        points = coordinates.get(coordinate_name) or coordinates.get(full_name) or []
        if not points:
            continue
        latitude = sum(point[0] for point in points) / len(points)
        longitude = sum(point[1] for point in points) / len(points)
        counties[short_name] = [
            int(row["POPESTIMATE2025"]),
            round(latitude, 6),
            round(longitude, 6),
            full_name,
            "2025",
        ]

payload = json.dumps(dict(sorted(counties.items())), ensure_ascii=False, separators=(",", ":"))
OUTPUT.write_text(
    "// California county population and approximate-center snapshot.\n"
    f"globalThis.CALIFORNIA_COUNTY_REFERENCE={payload};\n",
    encoding="utf-8",
)
print(f"Wrote {len(counties)} California county records.")
