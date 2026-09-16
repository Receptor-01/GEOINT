import csv
import json
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUTPUT = ROOT / "data" / "area-reference-data.js"


def read_zips():
    gazetteer = {}
    with (RAW / "zcta" / "2020_Gaz_zcta_national.txt").open(encoding="utf-8") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        reader.fieldnames = [field.strip() for field in reader.fieldnames]
        for row in reader:
            gazetteer[row["GEOID"]] = {
                "lat": float(row["INTPTLAT"]),
                "lon": float(row["INTPTLONG"]),
                "area": float(row["ALAND_SQMI"]),
            }

    places = {}
    with (RAW / "geonames-US" / "US.txt").open(encoding="utf-8") as handle:
        for row in csv.reader(handle, delimiter="\t"):
            if len(row) < 12:
                continue
            code = row[1].zfill(5)
            places.setdefault(
                code,
                {
                    "city": row[2],
                    "state": row[4],
                    "stateName": row[3],
                    "county": row[5],
                    "lat": float(row[9]),
                    "lon": float(row[10]),
                },
            )

    output = {}
    for code in sorted(set(gazetteer) | set(places)):
        geo = gazetteer.get(code, places.get(code, {}))
        place = places.get(code, {})
        output[code] = [
            round(geo["lat"], 6),
            round(geo["lon"], 6),
            place.get("city", ""),
            place.get("state", ""),
            place.get("stateName", ""),
            place.get("county", ""),
            round(gazetteer.get(code, {}).get("area", 0), 2),
        ]
    return output


def read_area_codes():
    geo = {}
    with (RAW / "us-area-code-geo.csv").open(encoding="utf-8") as handle:
        for row in csv.reader(handle):
            if len(row) >= 3:
                geo[row[0]] = [round(float(row[1]), 6), round(float(row[2]), 6)]

    cities = defaultdict(list)
    with (RAW / "us-area-code-cities.csv").open(encoding="utf-8") as handle:
        for row in csv.reader(handle):
            if len(row) < 6:
                continue
            cities[row[0]].append([row[1], row[2], round(float(row[4]), 5), round(float(row[5]), 5)])

    with (RAW / "npa_report.csv").open(encoding="utf-8-sig", newline="") as handle:
        lines = handle.readlines()
    report_date = lines[0].strip().split(",", 1)[-1]
    reader = csv.DictReader(lines[1:])
    output = {}
    for row in reader:
        code = (row.get("NPA_ID") or "").strip()
        if len(code) != 3 or not code.isdigit():
            continue
        if row.get("COUNTRY") not in {"US", ""} and code not in geo:
            continue
        output[code] = {
            "geo": geo.get(code),
            "location": row.get("LOCATION", ""),
            "country": row.get("COUNTRY", ""),
            "type": row.get("type_of_code", ""),
            "use": row.get("USE", ""),
            "inService": row.get("IN_SERVICE", ""),
            "inServiceDate": row.get("IN_SERVICE_DT", ""),
            "overlay": row.get("OVERLAY", ""),
            "overlayComplex": row.get("OVERLAY_COMPLEX", ""),
            "parent": row.get("PARENT_NPA_ID", ""),
            "service": row.get("SERVICE", ""),
            "timeZone": row.get("TIME_ZONE", ""),
            "areaServed": row.get("AREA_SERVED", ""),
            "cities": cities.get(code, []),
        }
    return output, report_date


def main():
    zips = read_zips()
    area_codes, report_date = read_area_codes()
    payload = {
        "meta": {
            "zctaVintage": "2020 Census",
            "nanpaFileDate": report_date,
            "zipCount": len(zips),
            "areaCodeCount": len(area_codes),
        },
        "zips": zips,
        "areaCodes": area_codes,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    OUTPUT.write_text(f"globalThis.AREA_REFERENCE_DATA={serialized};\n", encoding="utf-8")
    print(f"Wrote {OUTPUT}")
    print(f"ZIP records: {len(zips)}")
    print(f"Area-code records: {len(area_codes)}")


if __name__ == "__main__":
    main()
