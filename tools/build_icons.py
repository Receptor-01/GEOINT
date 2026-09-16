from pathlib import Path
from shutil import copyfile


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "icons" / "source"
SIZES = (16, 32, 48, 128)


def main() -> None:
    # Preserve the exact user-supplied artwork at each size, without redrawing.
    for size in SIZES:
        for filename in (f"geoint-logo-{size}.png", f"icon-{size}.png"):
            copyfile(SOURCE / f"icon-{size}.png", ROOT / "icons" / filename)


if __name__ == "__main__":
    main()
