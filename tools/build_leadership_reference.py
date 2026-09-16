import json
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "leadership-reference.js"
ENDPOINT = "https://query.wikidata.org/sparql"
LABEL_OVERRIDES = {
    "Q269909": "Andy Burnham",
    "Q5771800": "Claudia Sheinbaum",
    "Q42478807": "Đuro Macut",
}

COUNTRY_QUERY = """
SELECT ?iso2 ?countryLabel ?headState ?headStateLabel ?stateOfficeLabel
       ?headGovernment ?headGovernmentLabel ?governmentOfficeLabel WHERE {
  ?country wdt:P297 ?iso2.
  FILTER(STRLEN(?iso2) = 2)
  OPTIONAL { ?country wdt:P35 ?headState. }
  OPTIONAL { ?country wdt:P1906 ?stateOffice. }
  OPTIONAL { ?country wdt:P6 ?headGovernment. }
  OPTIONAL { ?country wdt:P1313 ?governmentOffice. }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "en".
    ?country rdfs:label ?countryLabel.
    ?headState rdfs:label ?headStateLabel.
    ?stateOffice rdfs:label ?stateOfficeLabel.
    ?headGovernment rdfs:label ?headGovernmentLabel.
    ?governmentOffice rdfs:label ?governmentOfficeLabel.
  }
}
"""

STATE_QUERY = """
SELECT ?code ?stateLabel ?governor ?governorLabel WHERE {
  ?state wdt:P31 wd:Q35657;
         wdt:P300 ?code;
         wdt:P6 ?governor.
  FILTER(STRSTARTS(?code, "US-"))
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "en".
    ?state rdfs:label ?stateLabel.
    ?governor rdfs:label ?governorLabel.
  }
}
"""


def query(sparql):
    url = ENDPOINT + "?" + urllib.parse.urlencode({"query": sparql, "format": "json"})
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/sparql-results+json",
            "User-Agent": "CaseAreaPrep/0.1 offline-snapshot-builder",
        },
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)["results"]["bindings"]


def value(row, key):
    return row.get(key, {}).get("value", "").strip()


def short_office(label, fallback):
    clean = label.strip()
    if not clean:
        return fallback
    lowered = clean.lower()
    for prefix in ("president of ", "prime minister of ", "governor of ", "monarch of "):
        if lowered.startswith(prefix):
            return prefix[:-4].upper()
    return clean.upper()


def entity_labels(entity_ids):
    labels = {}
    ids = sorted(set(entity_ids))
    for start in range(0, len(ids), 50):
        batch = ids[start:start + 50]
        url = "https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode({
            "action": "wbgetentities",
            "ids": "|".join(batch),
            "props": "labels",
            "languages": "en",
            "format": "json",
        })
        request = urllib.request.Request(url, headers={"User-Agent": "CaseAreaPrep/0.1 snapshot-builder"})
        with urllib.request.urlopen(request, timeout=60) as response:
            entities = json.load(response).get("entities", {})
        for entity_id, entity in entities.items():
            label = entity.get("labels", {}).get("en", {}).get("value")
            if label:
                labels[entity_id] = label
    return labels


countries = {}
for row in query(COUNTRY_QUERY):
    code = value(row, "iso2").upper()
    if not code:
        continue
    country = countries.setdefault(code, {"name": value(row, "countryLabel"), "leaders": []})
    candidates = [
        (value(row, "headState"), value(row, "headStateLabel"),
         short_office(value(row, "stateOfficeLabel"), "HEAD OF STATE")),
        (value(row, "headGovernment"), value(row, "headGovernmentLabel"),
         short_office(value(row, "governmentOfficeLabel"), "HEAD OF GOVERNMENT")),
    ]
    for entity, name, role in candidates:
        if not entity or not name:
            continue
        existing = next((leader for leader in country["leaders"] if leader["entity"] == entity), None)
        if existing:
            if role not in existing["roles"]:
                existing["roles"].append(role)
        else:
            country["leaders"].append({"entity": entity, "name": name, "roles": [role]})

states = {}
for row in query(STATE_QUERY):
    code = value(row, "code").upper().replace("US-", "")
    name = value(row, "governorLabel")
    if code and name:
        states[code] = {"name": value(row, "stateLabel"), "governor": name}

unresolved = [
    leader["entity"].rsplit("/", 1)[-1]
    for country in countries.values()
    for leader in country["leaders"]
    if leader["name"].startswith("Q") and leader["name"][1:].isdigit()
]
resolved_labels = entity_labels(unresolved)
for country in countries.values():
    for leader in country["leaders"]:
        entity_id = leader["entity"].rsplit("/", 1)[-1]
        leader["name"] = LABEL_OVERRIDES.get(
            entity_id,
            resolved_labels.get(entity_id, leader["name"]),
        )
        leader.pop("entity", None)

snapshot = {
    "asOf": date.today().isoformat(),
    "countries": dict(sorted(countries.items())),
    "states": dict(sorted(states.items())),
    "sources": {
        "world": "Wikidata current heads of state and government",
        "states": "Wikidata current U.S. state heads of government",
    },
}
payload = json.dumps(snapshot, ensure_ascii=False, separators=(",", ":"))
OUTPUT.write_text(
    "// Dated offline leadership snapshot. Regenerate with tools/build_leadership_reference.py.\n"
    f"globalThis.LEADERSHIP_REFERENCE={payload};\n",
    encoding="utf-8",
)
print(f"Wrote {len(countries)} country and {len(states)} state leadership records.")
