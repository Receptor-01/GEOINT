# GEOINT — Complete Project Blueprint

> Handoff document for maintaining, reproducing, or redesigning the GEOINT browser extension.
>
> Project snapshot documented: September 2026.

## 1. Executive summary

GEOINT is a local-first Manifest V3 Chrome/Brave browser extension that turns a place name, street address, U.S. ZIP code, or North American phone area code into a dense geographic-intelligence dashboard.

The extension has two screens:

1. A deliberately minimal toolbar popup with one **OPEN GEOINT** button.
2. A full-page dashboard containing clocks, location search, jurisdiction intelligence, flags and geographic silhouettes, demographic/economic cards, and a seven-position map carousel.

It uses plain HTML, CSS, and JavaScript. There is no framework, package manager, bundler, compilation step, remote application server, user account, analytics system, or paid API key. Most reference intelligence is generated ahead of time and committed as JavaScript snapshots. Live map and location functions use public third-party pages or endpoints.

The visual identity is a dark tactical console: nearly black surfaces, muted gray controls, orange hover/active states, monospaced/OCR-style uppercase typography, thin grid lines, restrained glow, and compact information density.

## 2. Canonical project location

The extension root on the current Windows computer is:

```text
C:\Users\andre\OneDrive\Documents\CASE PREP
```

That folder is the directory selected when Chrome or Brave is told to **Load unpacked**.

Important scope boundary: the directories below are separate desktop projects that happen to live inside the same parent directory. They are not part of the GEOINT extension runtime:

```text
CASE PREP\Recon Bot\
CASE PREP\EVIDENCE LOCKER\
CASE PREP\VEHICLE IMAGER\
```

Do not copy, rewrite, or package those directories as part of GEOINT unless intentionally reorganizing the repository.

## 3. Technology and runtime

| Layer | Implementation |
|---|---|
| Extension platform | Chrome Manifest V3 |
| Browsers | Chrome and Brave; much of the dashboard can also run as ordinary HTTP-served HTML |
| UI | Handwritten HTML5 |
| Styling | One main handwritten CSS file plus small map-specific stylesheets |
| Logic | Vanilla JavaScript, no framework |
| Persistent state | `chrome.storage.local`; `localStorage` compatibility fallback outside extension mode |
| Background behavior | Manifest V3 service worker for the selection context menu |
| Geocoding | Nominatim search and reverse-geocoding endpoints |
| Timezone lookup | TimeAPI.io, with cached results |
| Satellite imagery | Google Maps satellite iframe centered using resolved latitude/longitude |
| Street map | OpenStreetMap export iframe |
| Weather | Windy embeds for temperature, fire-weather danger, and UV index |
| Terrain | Local slippy-map viewer using OpenTopoMap raster tiles |
| Population visual | Local canvas visualization built from bundled country/state population snapshots |
| Screenshot output | `chrome.tabs.captureVisibleTab` plus Canvas cropping and `chrome.downloads` |
| Reference-data generation | Standalone Python scripts under `tools\` |

No Node.js dependency is required to run the extension. Node can still be used for JavaScript syntax validation with `node --check`.

## 4. Top-level file map

### Extension entry points

| File | Purpose |
|---|---|
| `manifest.json` | Manifest V3 metadata, permissions, content security policy, popup, service worker, icons, and Google Maps content script registration |
| `popup.html` | Minimal extension-toolbar popup |
| `popup.js` | Opens the dashboard using the last location, defaulting to Coronado Island, California |
| `background.js` | Creates the right-click **Prepare area for...** selected-text context-menu action |
| `dashboard.html` | Full dashboard DOM structure and data-script loading order |
| `dashboard.js` | Primary controller: search routing, geocoding, clocks, cards, side panel, carousel, map loading, drawing, screenshots, and persistence |
| `styles.css` | Complete popup/dashboard visual system and responsive layout |
| `browser-compat.js` | Supplies a small mock `chrome` API backed by `localStorage` when previewing outside extension mode |
| `map-wheel-bridge.js` | Makes wheel input friendlier inside embedded Google Maps frames |

Approximate current sizes:

```text
dashboard.js     2,243 lines / 97 KB
styles.css       3,394 lines / 74 KB
dashboard.html     320 lines / 17 KB
```

### Self-contained local map views

| Files | Purpose |
|---|---|
| `population-grid.html`, `.css`, `.js` | Interactive population-square world visualization with infinite horizontal wrapping, zoom, drag, hover details, and flags |
| `topographic-map.html`, `.css`, `.js` | Drag-and-zoom raster topographic viewer using OpenTopoMap tiles |
| `time-zone-map.html`, `.css`, `.js` | Approximate highlighted longitude band for reverse time-of-day searches |
| `population-map.html`, `.css`, `.js` | Older static continent population-atlas viewer; retained but not part of the present main carousel |

### Supporting folders

```text
assets\flags\                         326 flag files
assets\geo-silhouettes\countries\   241 isolated country silhouettes
assets\geo-silhouettes\country-context\ 240 continent-context images
assets\geo-silhouettes\states\       52 isolated U.S. state/territory silhouettes
assets\geo-silhouettes\state-context\ 52 U.S.-context images
assets\geo-silhouettes\hemispheres\   4 hemisphere images
assets\population\                     7 legacy/static population atlas images
icons\                                  extension icon variants and source art
data\                                   generated runtime reference snapshots
data\raw\                               source datasets used by builders
tools\                                  Python snapshot/asset builders
```

## 5. Manifest and extension permissions

The current extension is named `GEOINT`, version `0.1.0`, and uses Manifest V3.

Declared permissions:

| Permission | Why it exists |
|---|---|
| `storage` | Saves active location, search history, coordinate cache, and timezone cache |
| `contextMenus` | Adds the selected-text lookup command |
| `activeTab` | Supports interaction with the active dashboard tab and screenshot workflow |
| `downloads` | Writes cropped map screenshots to the browser Downloads folder |

The manifest currently declares broad `<all_urls>` host access as well as explicit provider origins. A production Web Store version should audit whether `<all_urls>` can be removed or narrowed.

The content security policy allows:

- Network connections to Nominatim and TimeAPI.io.
- images from the extension, data URLs, OpenTopoMap, and Wikimedia.
- frames from local extension pages, Google Maps, OpenStreetMap, and Windy.

The Google Maps wheel helper is injected only into Google Maps frames.

## 6. User experience and layout

### Toolbar popup

The popup is intentionally sparse. It displays the GEOINT emblem/name and one **OPEN GEOINT** button. Clicking it:

1. Reads `activeAddress` from local extension storage.
2. Uses `Coronado Island, California` if nothing has been saved.
3. Opens `dashboard.html?address=<location>` in a new tab.
4. Closes the popup.

### Sticky dashboard header

The fixed header contains, from left to right:

- GEOINT brand.
- Home Time clock fixed to `America/Los_Angeles`, shown in 24-hour time.
- Location Time clock for the active map location, also in 24-hour time.
- A compact location input.
- A crosshair/map-pin submit button.
- Local Workspace status.

Clicking the Home Time card resets the entire dashboard to **Coronado Island, California**.

Clicking the Location Time card transforms it into a time entry field with AM/PM selection. This performs an approximate reverse time-zone search, not a location-proofing calculation.

### Left side panel

The fixed left panel has three navigable pages:

1. **INTEL**
   - Clickable jurisdiction/location title that opens Google search.
   - NEWS and IMAGES Google lookup buttons.
   - Current leadership cards; each searches the leader's name in Google.
   - Major-city cards for countries and non-California U.S. states, paginated in batches of five; clicking a city reloads the dashboard to that city.
   - California-specific county context and nearby-city cards.
2. **GEOINT**
   - Direct U.S. ZIP/ZCTA search.
   - Direct NANPA area-code search.
   - Nearest ZIPs and related/regional area codes.
   - Bundled reference metadata and limitations.
3. **HISTORY**
   - Locally stored recent location searches.
   - Click any history card to reload it.
   - Clear-history control.

### Area Briefing strip

The briefing title occupies its own line so long addresses do not push the cards out of position. The card row can include:

- Current country and subdivision flags.
- Historical flag cycling where a timeline is bundled; U.S. flags are generated dynamically by star count.
- Geographic silhouette card cycling through:
  1. isolated state/country outline;
  2. state within the U.S. or country within its continent;
  3. hemisphere view with selected hemispheres highlighted.
- Capital card; clicking reloads the dashboard to that capital.
- Established-year card; clicking cycles through accepted or disputed milestone years.
- Currency card; opens Google conversion from **1 USD** to the location's primary currency.
- Population estimate card(s).
- GDP snapshot card.
- Three-cube visibility controller.

For a resolved city, population can display both the city and country. For a U.S. state/address it can display state and United States. Clicking a population record transforms the whole card into an animated battery-style share visualization. U.S. states compare against total U.S. population; countries compare against world population; cities compare against their containing country.

The GDP card supports normal value, animated share/battery mode, and a multi-year animated trendline. State GDP is compared with U.S. GDP.

### Three-cube visibility control

The geometric control above the map carousel has three cube segments:

- Top cube: show/hide Area Briefing.
- Left cube: show/hide the side panel.
- Right cube: show/hide map previews.

All three can be collapsed to leave an unobstructed primary-map workspace.

## 7. Map carousel

The current carousel contains seven positions:

1. **Satellite** — Google Maps satellite imagery.
2. **Population Quadrants** — local interactive canvas visualization.
3. **OpenStreetMap** — coordinate-centered OSM embed.
4. **Temperature Radar** — Windy temperature overlay.
5. **Fire Danger** — Windy fire weather index. For a reverse-time query only, this slot temporarily becomes **World Time Band**.
6. **UV Index** — Windy UV overlay.
7. **Topographic Terrain** — local viewer over OpenTopoMap tiles.

One map is promoted to the large primary area. Three following maps appear as right-side previews. Remaining maps stay in the DOM but outside the visible arrangement until navigation changes focus. The **FOCUS** control on a preview promotes it. The chevron controls cycle through all views without reconstructing the page.

### Satellite centering and zoom

Satellite must never pass the raw ambiguous search text to Google Maps after the main geocoder has already resolved it. The correct flow is:

```text
user query -> getCoordinates() -> latitude/longitude -> Google satellite embed
```

The current coordinate URL form is conceptually:

```text
https://www.google.com/maps?q=<latitude,longitude>&z=<zoom>&t=k&output=embed
```

Current default zoom rules in `getSatelliteZoom()`:

| Resolved/query type | Zoom |
|---|---:|
| Exact country-name query | 5 |
| Exact subdivision/state-name query | 6 |
| Street-like query containing digits | 16 |
| Resolved city | 10 |
| Other subdivision result | 7 |
| Fallback | 5 |

These intentionally open farther back than Google defaults so users see regional context without immediately zooming out.

### Drawing and screenshot tools

Every monitor header receives a local overlay toolbar:

- Camera: capture the visible map region.
- Pencil: enable/disable drawing overlay.
- Black, red, and blue ink choices.
- Clear overlay.

Drawing occurs on a transparent Canvas over the iframe, so it does not modify the map provider. The camera workflow captures the visible browser tab, crops it to the map screen bounds, converts the result to PNG, and downloads it with a unique filename resembling:

```text
GEOINT-Satellite-Jordan-2026-09-14T...png
```

Because this uses extension-only APIs (`chrome.windows`, `chrome.tabs.captureVisibleTab`, and `chrome.downloads`), it is not fully functional in the ordinary browser-compat preview.

## 8. Search and update lifecycle

The central entry point is `routeSearchTerm(term)`:

```text
time:HH:MM -> reverse time-band workflow
exactly 5 digits -> U.S. ZIP workflow
exactly 3 digits -> NANPA area-code workflow
everything else -> general address/place workflow
```

The normal location lifecycle is:

```text
1. User submits location
2. loadAddress() updates visible title, URL, and stored activeAddress
3. renderMapWall() creates all carousel monitors
4. getCoordinates() resolves one canonical coordinate/context object
5. Every coordinate-based map receives those same coordinates
6. Briefing cards update from bundled datasets
7. Side intelligence updates
8. Location clock/timezone updates
9. ZIP/area-code proximity reference updates
10. Search is written to local history
```

The resolved coordinate object generally has this shape:

```js
{
  lat: 31.24,
  lon: 36.51,
  countryCode: "JO",
  countryName: "Jordan",
  subdivisionCode: "",
  subdivisionName: "",
  city: "",
  county: "",
  zipCode: ""
}
```

### Geocoding strategy

`getCoordinates(address)` resolves locations in this order:

1. `chrome.storage.local` coordinate cache.
2. Bundled `LOCATION_REFERENCE` exact aliases.
3. Local hints inferred from ZIP data, U.S. city/state records, or global major-city data.
4. Nominatim forward search with address details.
5. Reverse-geocode enrichment if jurisdiction fields are incomplete.
6. U.S. nearest-ZCTA jurisdiction repair where appropriate.
7. Best local hint as a last fallback.

This single result is deliberately reused. Do not let individual map providers independently reinterpret a raw place string; doing so previously caused a search for `Jordan` to show Southern California businesses named Jordan while every other component correctly displayed the country.

### Race-condition protection

Location changes are asynchronous. `activeAddress` and a captured `requestedAddress`/`renderedAddress` are compared after awaited operations. If the user has started a newer search, the stale result must not overwrite the current screen. Geographic-image loading similarly uses an incrementing request identifier.

## 9. Persistence

The dashboard stores state in `chrome.storage.local`.

Known keys/patterns:

| Key | Content |
|---|---|
| `activeAddress` | Last successful/requested search term |
| `searchHistory` | Array of recent `{term, title, searchedAt}` entries |
| `coordinates:<normalized query>` | Cached coordinate and jurisdiction object |
| timezone cache keys | Cached timezone results used by the location clock |

When extension APIs are absent, `browser-compat.js` serializes the same conceptual storage into the `caseAreaPrep` localStorage key.

## 10. Runtime data snapshots

Data files are ordinary scripts loaded before `dashboard.js`. Each assigns an object to `globalThis`; there is no fetch or JSON parse required at runtime.

| File / global | Contents |
|---|---|
| `data/area-reference-data.js` / `AREA_REFERENCE_DATA` | 2020 Census ZCTA centers plus NANPA area-code metadata and geocenters |
| `data/population-reference.js` / `POPULATION_REFERENCE` | U.S./state Census Vintage 2025 totals and latest bundled World Bank country totals/capitals |
| `data/currency-reference.js` / `CURRENCY_REFERENCE` | Country-to-currency code, symbol, and name mappings |
| `data/location-reference.js` / `LOCATION_REFERENCE` | Normalized place aliases to coordinates and jurisdiction context |
| `data/leadership-reference.js` / `LEADERSHIP_REFERENCE` | Timestamped country leaders and U.S. president/governors |
| `data/gdp-reference.js` / `GDP_REFERENCE` | Country and U.S. state GDP snapshots/time series |
| `data/established-reference.js` / `ESTABLISHED_REFERENCE` | Country/state milestone years and event labels |
| `data/flag-history.js` / `FLAG_HISTORY` | Selected historical flag timelines |
| `data/city-reference.js` / `CITY_REFERENCE` | Country and U.S. state city populations and coordinates |
| `data/california-county-reference.js` / `CALIFORNIA_COUNTY_REFERENCE` | California county populations, centers, and nearby/local-city context |
| `data/country-centroids.js` / `COUNTRY_CENTROIDS` | Country positions used by Population Quadrants |
| `data/subdivision-grid.js` / `SUBDIVISION_GRID` | U.S. states and Australian states/territories for Population Quadrants |
| `data/location-languages.js` | Older language snapshot; currently not loaded by `dashboard.html` |

`area-reference-data.js` is intentionally large—about 3.3 MB—because lookup data is bundled rather than requested per search.

### Compact record conventions

Many generated files use arrays instead of verbose objects to reduce size. For example:

```js
POPULATION_REFERENCE.states.CA
// [39355309, 2025, "California", "Sacramento"]

CITY_REFERENCE countries/state entries
// typically [cityName, population, latitude, longitude, sourceDate]

AREA_REFERENCE_DATA.zips["92028"]
// [latitude, longitude, city, stateCode, stateName, county, landArea]
```

Any rebuild must preserve the positional schemas expected by `dashboard.js`, or update all consumers at the same time.

## 11. Data and asset build tools

The Python scripts under `tools\` regenerate committed snapshots. They are maintenance utilities, not extension runtime code.

| Script | Output / role |
|---|---|
| `build_area_reference.py` | Builds ZIP/ZCTA and NANPA reference bundle from files in `data/raw` |
| `build_california_county_reference.py` | Builds California county reference snapshot |
| `build_city_reference.py` | Builds city records from `cities15000.zip` |
| `build_currency_reference.py` | Builds currencies from bundled country metadata |
| `build_gdp_reference.py` | Builds country GDP from World Bank plus state GDP sources |
| `build_geo_silhouettes.py` | Renders orange/gray country/state silhouettes, context maps, hemisphere art, and capital markers |
| `build_icons.py` | Renders extension icon sizes from source artwork |
| `build_language_reference.py` | Builds the currently unused language snapshot |
| `build_leadership_reference.py` | Refreshes political leadership using Wikidata/Wikipedia endpoints and static U.S. records |
| `build_location_reference.py` | Builds normalized aliases and coordinates |
| `build_population_grid.py` | Builds country centroids and U.S./Australian subdivision-grid data |
| `build_population_atlas.py` | Builds legacy static continent population images |
| `build_population_reference.py` | Refreshes Census state/U.S. and World Bank country population totals |

Some builders access the internet and some consume local raw files. They should be run deliberately, reviewed, and then the generated JavaScript/assets should be committed together. Leadership, population, GDP, and NANPA data are snapshots—not perpetual live data.

## 12. Visual design system

### Core palette

Defined as CSS custom properties near the beginning of `styles.css`:

```css
--brand: #FA5712;
--brand-bright: #FF9A3C;
--cream: #FFD298;
--page: #050505;
--panel: #080808;
--card: #0D0D0D;
--raised: #111111;
--selected: #241109;
--text: #FFFFFF;
--muted: #777777;
--disabled: #4A4A4A;
--subtle: #292929;
--success: #24E876;
--warning: #F5C542;
--danger: #FF3B30;
```

The present styling philosophy is **gray at rest, orange on intent**:

- Most borders, controls, side-panel cards, clocks, navigation buttons, and map frames rest in neutral gray.
- Hover, focus, selection, and important active states turn orange.
- The active Location Time clock remains orange by default.
- Flags retain full natural color while their frames follow the neutral/active system.
- Map imagery remains visually dominant.

### Typography

Primary stacks:

```css
--font-display: "Steiner", "OCR A Std", "OCR A", Consolas, monospace;
--font-interface: "OCR A Std", "OCR A", Consolas, monospace;
```

Headings are generally italic, bold, uppercase, and tracked. Small metadata uses Consolas/monospace. The visual design depends on tight hierarchy more than decorative graphics.

`Steiner` and `OCR A Std` are not bundled as web fonts, so appearance can differ on computers that lack them. A faithful portable rebuild should legally bundle an equivalent font or intentionally select a consistent open-source substitute.

### Background and surfaces

The application uses subtle CSS grid backgrounds, thin borders, near-black panels, tiny orange accents, and controlled shadows/glows. Avoid filling every element orange. The map content and full-color flags should provide contrast against restrained interface chrome.

### Key dimensions

- Sticky header minimum height: about 76 px.
- Fixed side panel: about 262 px wide; from 94 px below top to 20 px above bottom.
- Desktop map wall: primary column plus 330 px preview column.
- Map wall height: `clamp(720px, 78vh, 980px)`.
- Main map spans all three preview rows.
- Briefing cards use a wrapping flex row, but the address title stays above them.

### Responsive behavior

Breakpoints exist around 1500, 1100, 900, 850, and 620 px, plus `prefers-reduced-motion` handling.

- Narrow desktops hide nonessential brand/badge text.
- Around tablet widths, the side panel overlays rather than permanently consuming horizontal space.
- Below roughly 900 px, the map wall becomes a single column.
- Below roughly 850 px, header clocks are hidden to preserve search space.

The project is responsive enough for browser viewing, but a fully polished iPad-native interaction model remains future work.

## 13. Population Quadrants implementation

Population Quadrants is a custom Canvas—not a literal map.

Its design goals:

- Approximate geographic placement by country centroid.
- Square area scaled to population.
- U.S. and Australian subdivisions layered into their national regions.
- Four-quadrant/hemisphere orientation.
- Gray squares at rest; darker/black hover state.
- Tooltip with flag, country/subdivision name, code, type, and abbreviated population.
- Zoom controls and wheel zoom.
- Click-and-drag horizontal panning.
- Infinite east/west wrapping while north/south remains bounded.

The visualization is educational and comparative. It is not a cartographically exact population-density map.

## 14. Clock and reverse-time behavior

### Home clock

- Hard-coded timezone: `America/Los_Angeles`.
- Location label: Los Angeles / San Diego.
- Displays current PST/PDT abbreviation automatically.
- Updates every second.
- Clicking resets to Coronado Island, California.

### Location clock

- Uses the resolved geographic location.
- Looks up and caches a timezone.
- Displays location-local military time, date, and zone.
- Clicking opens the reverse-time entry mode.

### Reverse time search

The user provides a 12-hour time and AM/PM. The code compares that target against a curated list of UTC offsets, selects the closest present-time offset, converts it to an approximate central longitude (`offset * 15`), recenters to that band, and temporarily replaces Fire Danger with the local World Time Band view.

This is a rough orientation aid. It cannot determine a person's location and must not be presented as doing so; daylight-saving policy, fractional offsets, political boundaries, and user error create broad uncertainty.

## 15. External services and what is actually local

### Bundled/local

- Static intelligence datasets under `data\`.
- Flags and geographic silhouette images.
- Population Quadrants logic/data.
- Time-band rendering logic.
- UI, history, cached lookup results, and drawing overlays.

### Remote at use time

- Nominatim geocoding/reverse geocoding.
- TimeAPI.io timezone resolution.
- Google Maps satellite embed and Google Search links.
- OpenStreetMap embed.
- Windy map embeds.
- OpenTopoMap tiles.

Therefore “local-first” means there is no GEOINT application server and much reference intelligence is bundled. It does **not** mean offline, anonymous, or invisible to map providers. Search terms or coordinates can be shared with those providers under their policies.

## 16. Installation and operation

### Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select `C:\Users\andre\OneDrive\Documents\CASE PREP`.
5. Pin GEOINT from the extensions menu.
6. After source edits, click the extension's **Reload** button or reload an open dashboard tab when sufficient.

### Brave

Use `brave://extensions` and follow the same procedure.

### Ordinary local preview / iPad-on-LAN helper

`START GEOINT FOR IPAD.cmd` starts Python's basic HTTP server on port 8080 and prints the computer's LAN address. This is a preview/temporary LAN-access method, not a serverless iPad installation. The iPad and computer must be on the same network, the terminal must remain open, and extension-only APIs such as screenshots/context menus are unavailable.

## 17. Important engineering rules

1. **Resolve once, reuse coordinates everywhere.** Do not re-geocode raw text independently inside Satellite or other providers.
2. **Guard asynchronous updates.** Old searches must never overwrite a newer active location.
3. **Preserve generated schemas.** Compact array positions are API contracts inside this codebase.
4. **Keep static and live data distinct.** Put an `asOf`/year label on political, population, GDP, and city snapshots.
5. **Keep state and country logic separate.** U.S. state population/GDP shares use U.S. totals; country shares use world totals.
6. **Retain a real city field.** Address geocoding should enrich `city`, `county`, state/subdivision, and country, not just latitude/longitude.
7. **Prefer progressive enhancement.** The core dashboard can preview over HTTP, but extension-only functions should fail clearly rather than silently.
8. **Respect iframe boundaries.** Drawing overlays can sit above frames, but code cannot inspect or manipulate cross-origin iframe content.
9. **Do not over-orange the UI.** Neutral at rest, orange for hover/active intent.
10. **Avoid paid-key assumptions.** The current product premise is useful without user-supplied API keys.

## 18. Known limitations and technical debt

- `dashboard.js` and `styles.css` are large monoliths. A rebuild should split them by domain without changing behavior.
- Data snapshots are global JavaScript assignments rather than typed modules or indexed storage.
- No automated browser integration test suite exists for the extension dashboard.
- There is no formal schema validation for generated datasets.
- Public endpoints and iframe providers can throttle, change parameters, or block embedding.
- Nominatim usage should comply with its public-instance policy; a production-scale app should use an appropriate provider or self-hosted instance.
- Timezone results depend on an external service and caching.
- Leadership and economic data age unless rebuild scripts are run.
- Broad host permission should be reduced before Web Store publication if possible.
- Typography is not fully portable because preferred fonts are not bundled.
- Screenshot capture depends on Chrome extension context and visible-tab geometry.
- The older `population-map.*` files and `location-languages.js` are retained but not part of the current principal interface.

## 19. Recommended modular architecture for a clean recreation

A behavior-preserving rewrite could use this structure while remaining framework-free:

```text
src/
  popup/
    popup.html
    popup.css
    popup.js
  dashboard/
    dashboard.html
    dashboard.css
    app.js
    state.js
    search-router.js
    geocoder.js
    storage.js
    clocks.js
    carousel.js
    screenshot.js
    side-panel.js
    cards/
      flags.js
      silhouette.js
      capital.js
      established.js
      currency.js
      population.js
      gdp.js
  maps/
    satellite.js
    openstreetmap.js
    windy.js
    population-grid/
    topographic/
    time-band/
  data/
    schemas.js
    generated/
assets/
tools/
manifest.json
```

Recommended internal state:

```js
const appState = {
  requestId: 0,
  query: "",
  resolvedLocation: null,
  activeMapId: "satellite",
  activeSidePanelPage: "intel",
  timeSearch: null,
  history: []
};
```

Each new search should increment `requestId`; every asynchronous result should check that it still matches before rendering.

## 20. Reconstruction acceptance checklist

A faithful recreation is complete only if all of the following work:

- [ ] Manifest V3 extension loads unpacked without errors.
- [ ] Popup opens the last location or Coronado Island default with one click.
- [ ] Selected webpage text can open a GEOINT search through the context menu.
- [ ] Header remains sticky.
- [ ] Home clock is Los Angeles time and resets the app when clicked.
- [ ] Location clock uses the searched location and supports reverse-time entry.
- [ ] Address, country, city, U.S. ZIP, and area-code searches route correctly.
- [ ] One resolved coordinate object drives every map.
- [ ] Satellite centers correctly for ambiguous country names such as Jordan.
- [ ] Satellite zoom opens wide enough for country/state/city context.
- [ ] Side Intel, GEOINT, and History pages all work.
- [ ] Leader, NEWS, IMAGES, jurisdiction, currency, capital, county, city, and history interactions work.
- [ ] Flags remain full color and historical flag cycling works where data exists.
- [ ] Geographic outline/context/hemisphere cycling works and capital dots are present in generated silhouettes.
- [ ] Population and GDP battery/trend interactions occupy the whole card and restore correctly.
- [ ] Seven carousel positions exist in the documented order.
- [ ] Time search temporarily replaces Fire Danger and focuses World Time Band.
- [ ] Population Quadrants supports hover flag/tooltips, zoom, drag, and horizontal wrapping.
- [ ] Three-cube control independently hides briefing, side panel, and map previews.
- [ ] Drawing overlay supports black/red/blue and clearing.
- [ ] Camera downloads a cropped PNG from an installed extension tab.
- [ ] Neutral controls highlight orange on hover/focus.
- [ ] Layout remains usable at desktop and tablet widths.
- [ ] No stale asynchronous result can overwrite a newer search.

## 21. Ready-to-give-another-LLM implementation brief

The following can be copied together with this repository when handing the project to another coding model:

> You are maintaining or recreating GEOINT, a local-first Manifest V3 Chrome/Brave geographic-intelligence dashboard. Treat `GEOINT-PROJECT-BLUEPRINT.md` as the product/architecture specification and inspect the existing source before changing behavior. Preserve the dark tactical aesthetic: near-black gridded surfaces, neutral gray controls at rest, full-color flags, and orange hover/active states. Keep the UI plain HTML/CSS/JavaScript unless explicitly asked to introduce a build system. One canonical geocoding result must drive Satellite, OpenStreetMap, Windy, terrain, clocks, and all intelligence cards. Preserve ZIP/area-code routing, locally stored history/caches, city/state/country population behavior, GDP battery/trend modes, historical flags, geographic silhouette/context/hemisphere cycling, California county context, seven-map carousel ordering, drawing/screenshot tools, reverse-time band workflow, and three-cube visibility controls. Do not merge the unrelated Recon Bot, Evidence Locker, or Vehicle Imager subprojects. Before finishing changes, validate JavaScript, inspect Manifest V3/CSP compatibility, test rapid consecutive searches for stale-result races, and manually verify at least a country (`Jordan`), city, full street address, U.S. state, U.S. ZIP, and NANPA area code.

## 22. Primary source-of-truth files

When this blueprint and behavior disagree, inspect these in order:

1. `manifest.json` — capabilities and browser security boundary.
2. `dashboard.html` — actual DOM and script loading order.
3. `dashboard.js` — actual behavior and data contracts.
4. `styles.css` — actual layout and visual states.
5. `data/*.js` — actual bundled coverage and snapshot vintages.
6. `population-grid.*`, `topographic-map.*`, `time-zone-map.*` — self-contained map implementations.
7. `tools/*.py` — reproducibility of data and generated assets.

This blueprint describes the current codebase, but the running code remains authoritative.
