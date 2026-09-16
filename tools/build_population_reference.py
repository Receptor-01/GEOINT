"""Build local US-state and world-country population estimate snapshots."""

from __future__ import annotations

import csv
import io
import json
import urllib.request
from pathlib import Path


OUTPUT = Path(__file__).resolve().parents[1] / "data" / "population-reference.js"
CENSUS_URL = "https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/state/totals/NST-EST2025-ALLDATA.csv"
WORLD_BANK_COUNTRIES = "https://api.worldbank.org/v2/country?format=json&per_page=400"
WORLD_BANK_POPULATION = "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&mrv=1&gapfill=Y&per_page=400"

STATE_ABBREVIATIONS = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
    "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
    "District of Columbia": "DC", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI",
    "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
    "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
    "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
    "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
    "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI",
    "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX",
    "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA",
    "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY", "Puerto Rico": "PR",
}

STATE_CAPITALS = {
    "AL": "Montgomery", "AK": "Juneau", "AZ": "Phoenix", "AR": "Little Rock",
    "CA": "Sacramento", "CO": "Denver", "CT": "Hartford", "DE": "Dover",
    "DC": "Washington, D.C.", "FL": "Tallahassee", "GA": "Atlanta", "HI": "Honolulu",
    "ID": "Boise", "IL": "Springfield", "IN": "Indianapolis", "IA": "Des Moines",
    "KS": "Topeka", "KY": "Frankfort", "LA": "Baton Rouge", "ME": "Augusta",
    "MD": "Annapolis", "MA": "Boston", "MI": "Lansing", "MN": "Saint Paul",
    "MS": "Jackson", "MO": "Jefferson City", "MT": "Helena", "NE": "Lincoln",
    "NV": "Carson City", "NH": "Concord", "NJ": "Trenton", "NM": "Santa Fe",
    "NY": "Albany", "NC": "Raleigh", "ND": "Bismarck", "OH": "Columbus",
    "OK": "Oklahoma City", "OR": "Salem", "PA": "Harrisburg", "RI": "Providence",
    "SC": "Columbia", "SD": "Pierre", "TN": "Nashville", "TX": "Austin",
    "UT": "Salt Lake City", "VT": "Montpelier", "VA": "Richmond", "WA": "Olympia",
    "WV": "Charleston", "WI": "Madison", "WY": "Cheyenne", "PR": "San Juan",
}


def download(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "Case-Area-Prep/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def build_states() -> tuple[dict[str, list], list]:
    rows = csv.DictReader(io.StringIO(download(CENSUS_URL).decode("latin-1")))
    states: dict[str, list] = {}
    united_states: list = []
    for row in rows:
        name = row["NAME"]
        value = int(row["POPESTIMATE2025"])
        if row["SUMLEV"] == "010":
            united_states = [value, 2025, name, "Washington, D.C."]
        elif row["SUMLEV"] == "040" and name in STATE_ABBREVIATIONS:
            abbreviation = STATE_ABBREVIATIONS[name]
            states[abbreviation] = [value, 2025, name, STATE_CAPITALS.get(abbreviation, "")]
    return states, united_states


def build_countries() -> dict[str, list]:
    metadata = json.loads(download(WORLD_BANK_COUNTRIES))[1]
    valid_codes = {
        country["iso2Code"]: [country["name"], country.get("capitalCity", "")]
        for country in metadata
        if country.get("region", {}).get("id") not in {"NA", ""}
    }
    observations = json.loads(download(WORLD_BANK_POPULATION))[1]
    countries: dict[str, list] = {}
    for observation in observations:
        code = observation.get("country", {}).get("id")
        value = observation.get("value")
        if code in valid_codes and value is not None:
            name, capital = valid_codes[code]
            countries[code] = [int(value), int(observation["date"]), name, capital]
    return countries


def main() -> None:
    states, united_states = build_states()
    countries = build_countries()
    countries["US"] = united_states
    data = {
        "meta": {
            "usSource": "US Census Vintage 2025",
            "countrySource": "World Bank SP.POP.TOTL most recent value",
        },
        "us": united_states,
        "states": states,
        "countries": countries,
    }
    OUTPUT.write_text(
        "globalThis.POPULATION_REFERENCE="
        + json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"Built {OUTPUT.name}: {len(states)} state/territory and {len(countries)} country records")


if __name__ == "__main__":
    main()
