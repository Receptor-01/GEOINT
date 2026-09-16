"""Build a compact local country-language lookup for the briefing panel."""

from __future__ import annotations

import csv
import io
import json
import re
import urllib.request
from pathlib import Path


SOURCE = "https://raw.githubusercontent.com/JovianHQ/opendatasets/master/data/countries-languages-spoken/countries-languages.csv"
OUTPUT = Path(__file__).resolve().parents[1] / "data" / "location-languages.js"
GENERIC = re.compile(r"^(other|native|tribal|minor|various|numerous|small|more than|about \d)", re.I)


def split_description(description: str) -> list[str]:
    parts = re.split(r"[,;]", description)
    languages: list[str] = []
    for part in parts:
        value = re.sub(r"\([^)]*\)", "", part)
        value = re.sub(r"\b\d+(?:\.\d+)?%.*$", "", value).strip()
        value = re.sub(r"^(?:major vernaculars|regional languages include|including)\s*:\s*", "", value, flags=re.I)
        value = re.sub(r"\b(?:both|all \d+)\s+official\b", "", value, flags=re.I)
        value = re.sub(r"\s+\b(?:official|national|state language)\b.*$", "", value, flags=re.I)
        value = value.strip(" .:-")
        if not value or GENERIC.match(value):
            continue
        if " and " in value and len(languages) < 2:
            candidates = [item.strip() for item in value.split(" and ") if item.strip()]
        else:
            candidates = [value]
        for candidate in candidates:
            candidate = candidate.replace(" language", "").strip()
            if candidate and candidate.casefold() not in {item.casefold() for item in languages}:
                languages.append(candidate)
            if len(languages) == 3:
                return languages
    return languages


def main() -> None:
    request = urllib.request.Request(SOURCE, headers={"User-Agent": "Case-Area-Prep/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        text = response.read().decode("utf-8-sig")
    rows = csv.DictReader(io.StringIO(text))
    data = {
        row["Country"].strip().casefold(): split_description(row["Languages Spoken"])
        for row in rows
    }
    aliases = {
        "united states of america": "united states",
        "czechia": "czech republic",
        "north macedonia": "macedonia",
        "timor-leste": "east timor",
        "cape verde": "cape verde",
        "vatican city": "vatican city (holy see)",
        "democratic republic of the congo": "congo, democratic republic of the",
        "republic of the congo": "congo, republic of",
        "south korea": "korea, south",
        "north korea": "korea, north",
    }
    for alias, source_name in aliases.items():
        if source_name in data:
            data[alias] = data[source_name]
    OUTPUT.write_text(
        "globalThis.LOCATION_LANGUAGE_DATA="
        + json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"Built {OUTPUT.name}: {len(data)} country entries")


if __name__ == "__main__":
    main()
