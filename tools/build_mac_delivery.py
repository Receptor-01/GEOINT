"""Build a portable, source-readable Chrome extension delivery without private browser state."""
from datetime import datetime
from pathlib import Path
import hashlib
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def main():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    files = {ROOT / "manifest.json"}
    for extension in ("*.html", "*.js", "*.css"):
        files.update(path for path in ROOT.glob(extension) if path.name != "MAC-SETUP.html")
    files.update((ROOT / "data").glob("*.js"))
    for folder in ("assets", "icons"):
        files.update(path for path in (ROOT / folder).rglob("*") if path.is_file())
    files.update(ROOT / name for name in ("README.md", "GEOINT-PROJECT-BLUEPRINT.md"))

    # Verify manifest entry points and direct HTML dependencies before packaging.
    required = [manifest["background"]["service_worker"], manifest["action"]["default_popup"], manifest["options_page"]]
    required += list(manifest["icons"].values()) + list(manifest["action"]["default_icon"].values())
    for script in manifest.get("content_scripts", []):
        required += script.get("js", []) + script.get("css", [])
    for relative in required:
        if ROOT / relative not in files:
            raise RuntimeError(f"Missing manifest dependency: {relative}")
    for path in files:
        if path.suffix != ".html":
            continue
        for link in re.findall(r'(?:src|href)="([^"]+)"', path.read_text(encoding="utf-8")):
            if link.startswith(("https:", "http:", "#", "data:")):
                continue
            relative = link.split("?")[0].split("#")[0]
            if relative and (path.parent / relative) not in files:
                raise RuntimeError(f"Missing HTML dependency: {path.name} -> {relative}")

    stamp = datetime.now().strftime("%Y-%m-%d-%H%M%S")
    name = f"GEOINT-Mac-{manifest['version']}-{stamp}"
    destination = ROOT / "deliveries"
    destination.mkdir(exist_ok=True)
    output = destination / f"{name}.zip"
    hashes = {}
    with zipfile.ZipFile(output, "x", zipfile.ZIP_DEFLATED) as archive:
        archive.write(ROOT / "MAC-SETUP.html", f"{name}/START-HERE.html")
        for path in sorted(files):
            relative = path.relative_to(ROOT).as_posix()
            archive.write(path, f"{name}/GEOINT/{relative}")
            hashes[relative] = hashlib.sha256(path.read_bytes()).hexdigest()
        archive.writestr(f"{name}/FILE-CHECKSUMS.json", json.dumps(hashes, indent=2))
    with zipfile.ZipFile(output) as archive:
        assert archive.testzip() is None
        for relative, digest in hashes.items():
            assert hashlib.sha256(archive.read(f"{name}/GEOINT/{relative}")).hexdigest() == digest
    print(f"Created: {output}")
    print(f"Verified {len(files)} extension files; ZIP size: {output.stat().st_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
