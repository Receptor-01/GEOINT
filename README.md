# GEOINT

For the shared Windows/Mac setup and update workflow, see [GITHUB-WORKFLOW.md](GITHUB-WORKFLOW.md). The Windows GitHub working copy is `C:\Users\andre\GitHub\GEOINT`.

A local-first Chrome/Brave extension for loading one address into a focused interactive imagery console. It uses no paid API keys.

For a complete architecture, file-by-file inventory, data-flow explanation, styling specification, maintenance guide, recreation plan, and ready-to-use LLM handoff prompt, see [GEOINT-PROJECT-BLUEPRINT.md](GEOINT-PROJECT-BLUEPRINT.md).

## Install in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked**.
4. Select this folder.
5. Pin **GEOINT** from the extensions menu.

For Brave, use `brave://extensions` and follow the same steps.

The installed extension uses the orange map-and-reticle emblem in `icons/` for its toolbar button and extension listing.

## Use

- The header search suggests countries, U.S. states, international cities, U.S. localities, and counties from the existing bundled datasets (about 40,000 unique places). Type a name, press Tab to fill the highlighted suggestion, then Enter to load it. Arrow keys choose alternatives; Escape dismisses suggestions. Region labels distinguish places with the same name. Basic spelling corrections appear when no direct match is available; no network requests or extra datasets are used for suggestions.

- Click the extension, enter an address, and select **Prepare area**.
- The standard dashboard carousel contains seven ordered views: Satellite, Population Quadrants, OpenStreetMap, Windy Temperature, Windy Fire Danger, Windy UV Index, and Topographic Terrain. The focused map and three following previews remain visible; the other maps stay hidden until carousel navigation brings them into view.
- Clicking the Location Time card opens a time-of-day search. Enter a 12-hour time and choose AM or PM to estimate the closest current UTC offset, highlight its approximate global longitude band, and recenter the map console. The World Time Band temporarily replaces Fire Danger only for that reverse-time result; the next ordinary location search restores Fire Danger. This is an orientation aid rather than proof of a person's location because political borders, daylight-saving rules, and non-hour offsets complicate time-zone geography.
- Topographic Terrain uses OpenTopoMap's worldwide contour and relief tiles inside a lightweight local viewer with drag, scroll-wheel zoom, and fixed location targeting. No API key is required.
- Population colors and settlement footprints are deliberately amplified for quick continent-scale pattern recognition; they are not literal geographic footprints or a quantitative legend.
- The Windy weather monitor opens on the Temperature layer by default while retaining its interactive layer chooser.
- Ordinary mouse-wheel input zooms the embedded maps. A local frame helper translates wheel input for Google embeds that normally require Ctrl+wheel.
- The Side Panel accepts five-digit US ZIP codes and three-digit phone area codes. The pinned main search auto-detects either format.
- For US locations, the panel passively shows the nearest Census ZCTAs and regional NANPA area codes. Every result is clickable and can become the active map location.
- ZIP and area-code reference data is bundled with the extension, so these searches do not add a paid or per-search API.
- The map focus carousel shows one large primary map with three live previews. Chevron navigation or each preview's Focus button promotes a different map without reloading it.
- A sticky header clock resolves the searched address's time zone, caches it locally, and keeps its live local time, date, and zone visible while the dashboard scrolls.
- A separate Home Time clock remains fixed to `America/Los_Angeles`, automatically displaying PST or PDT for Los Angeles and San Diego.
- Both header clocks use 24-hour military time with seconds.
- The Area Briefing title displays locally bundled country and available subdivision flags resolved from the searched location. The flag set includes world regions, US states, Canadian provinces, and UK constituent countries.
- A capital card immediately beside the flags shows the US state capital for American addresses and the national capital for international locations.
- Compact population cards show the resolved US state and United States Vintage 2025 estimates; other searches show the latest bundled World Bank country estimate and its year.
- California searches replace the generic largest-city and language summaries with a county-focused snapshot. The matched county appears first, followed by two nearby California counties; each card includes a Vintage 2025 population estimate and approximate center-to-location distance and can be clicked to reload that county.
- The sticky header contains the primary address search, so a new location can be loaded from anywhere on the page.
- Select an address on any webpage, right-click, and choose **Prepare area for…**

## Privacy and limitations

- There are no API keys, background map requests, analytics, or remote application servers.
- Loading an area shares the address or coordinates with the embedded map, weather, geocoding, and time-zone providers under their respective privacy terms.
- ZIP geography is based on 2020 Census ZIP Code Tabulation Areas (ZCTAs), which approximate mail-delivery ZIP areas and are not official USPS delivery boundaries.
- Area-code metadata comes from the bundled NANPA report shown in the panel. Number portability and relocation mean an area code indicates a numbering-plan region, not a person's identity or present location.
- ZIP place labels incorporate GeoNames postal data; area-code map centers incorporate the Area-Code-Geolocation-Database compilation.
- OpenTopoMap terrain tiles are based on OpenStreetMap data and elevation sources. Treat contours and mapped features as planning context and verify critical ground conditions independently.
- Bundled location flags are derived from Google's archived `region-flags` collection, using ISO/BCP region codes and its included per-flag licensing metadata.
- California county population estimates come from the US Census Bureau Vintage 2025 county totals; approximate county reference centers are derived from the bundled GeoNames postal-code dataset.
- US population estimates use the Census Bureau Vintage 2025 national/state dataset. International totals use the World Bank `SP.POP.TOTL` indicator's most recent available value at build time.
- Provider URLs and features can change over time.
- The tool does not determine whether a parking location is lawful or appropriate. Verify posted restrictions, current conditions, applicable law, employer policy, and property boundaries.

## Visual preview

The popup and dashboard can also be opened as ordinary local HTML for design review. A small compatibility layer uses browser `localStorage` only when Chrome's extension APIs are unavailable.
