import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "raw" / "countries.json"
OUTPUT = ROOT / "data" / "currency-reference.js"

countries = json.loads(SOURCE.read_text(encoding="utf-8"))
reference = {}

for country in countries:
    code = country.get("cca2")
    currencies = country.get("currencies") or {}
    if not code or not currencies:
        continue
    reference[code] = [
        [currency_code, details.get("symbol") or currency_code, details.get("name") or currency_code]
        for currency_code, details in currencies.items()
    ]

payload = json.dumps(dict(sorted(reference.items())), ensure_ascii=False, separators=(",", ":"))
OUTPUT.write_text(
    "// Bundled country-to-currency snapshot generated from mledoze/countries.\n"
    f"globalThis.CURRENCY_REFERENCE={payload};\n",
    encoding="utf-8",
)
print(f"Wrote {len(reference)} country currency records to {OUTPUT}")
