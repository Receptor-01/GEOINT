// Reuse bundled place data: no extra downloads or per-keystroke network requests.
(() => {
  const normalize = (value) => String(value).normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const byCode = new Map();
  for (const [alias, record] of Object.entries(globalThis.LOCATION_REFERENCE || {})) {
    const [, , code, name, subdivision] = record;
    if (!code || !name || subdivision) continue;
    if (!byCode.has(code)) byCode.set(code, { name, aliases: new Set([normalize(name)]) });
    byCode.get(code).aliases.add(normalize(alias));
  }
  const places = new Map();
  function add(name, label, type, aliases = [], population = 0, flagCode = "") {
    if (!name) return;
    const key = normalize(label);
    if (!places.has(key)) places.set(key, { name: label, shortName: normalize(name), type, population, aliases: new Set() });
    const place = places.get(key);
    if (flagCode) place.flagCode = flagCode;
    place.population = Math.max(place.population, Number(population) || 0);
    for (const alias of [name, label, ...aliases]) place.aliases.add(normalize(alias));
  }
  for (const [code, country] of byCode) {
    add(country.name, country.name, "Country / territory", country.aliases);
    places.get(normalize(country.name)).flagCode = code;
  }
  const stateNames = new Map();
  for (const [alias, record] of Object.entries(globalThis.LOCATION_REFERENCE || {})) {
    const [, , countryCode, countryName, subdivision, name] = record;
    if (!subdivision || !name) continue;
    stateNames.set(subdivision.replace(/^US-/, ""), name);
    add(name, `${name}, ${countryName}`, "State / region", [alias]);
  }
  const countryName = (code) => byCode.get(code)?.name || code;
  const cities = globalThis.CITY_REFERENCE || {};
  for (const [code, records] of Object.entries(cities.countries || {})) {
    if (code === "US") continue; // U.S. entries below include their state.
    for (const [name, population] of records) add(name, `${name}, ${countryName(code)}`, "City", [], population, code);
  }
  for (const [state, records] of Object.entries(cities.states || {})) {
    const region = stateNames.get(state) || state;
    for (const [name, population] of records) {
      add(name, `${name}, ${region}, United States`, "City", [`${name} ${state}`, `${name} ${region}`], population, "US");
    }
  }
  for (const record of Object.values(globalThis.AREA_REFERENCE_DATA?.zips || {})) {
    const [, , city, state, stateName, county] = record;
    if (!state) continue;
    const region = stateNames.get(state) || stateName || state;
    if (city) add(city, `${city}, ${region}, United States`, "City / locality", [`${city} ${state}`, `${city} ${region}`], 0, "US");
    if (county) {
      const suffix = state === "LA" ? " Parish" : state === "AK" ? "" : " County";
      const name = /county|parish|borough|census area|municipality|city/i.test(county) ? county : county + suffix;
      add(name, `${name}, ${region}, United States`, "County / region", [`${name} ${state}`, `${county} ${region}`, county]);
    }
  }
  const entries = [...places.values()];

  // Edit distance also tolerates a swapped pair of letters (e.g. "Azerbaijan").
  function distance(left, right) {
    const rows = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
    for (let i = 0; i <= left.length; i++) rows[i][0] = i;
    for (let j = 0; j <= right.length; j++) rows[0][j] = j;
    for (let i = 1; i <= left.length; i++) {
      for (let j = 1; j <= right.length; j++) {
        rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1,
          rows[i - 1][j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
          rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
        }
      }
    }
    return rows[left.length][right.length];
  }

  function suggest(value) {
    const query = normalize(value);
    if (!query || /\d/.test(query) || query.length > 60) return [];
    const ranked = entries.map((country) => {
      let score = Infinity;
      for (const alias of country.aliases) {
        if (alias === query) score = Math.min(score, 0);
        else if (alias.startsWith(query)) score = Math.min(score, 1);
        else if (country.type === "Country / territory" && query.length >= 3 && alias.split(" ").some((word) => word.startsWith(query))) {
          score = Math.min(score, 2);
        }
      }
      return Number.isFinite(score) ? { ...country, score } : null;
    }).filter(Boolean)
      .sort(compare);
    if (ranked.length || query.length < 4) return ranked.slice(0, 8);
    const tolerance = query.length >= 7 ? 2 : 1;
    // Fuzzy matching runs only when prefix/alias matching has no results.
    // Limit candidates by their leading letters before computing edit distance.
    return entries.filter((place) => place.shortName[0] === query[0]
      && place.shortName.length >= query.length - tolerance).map((place) => {
      const errors = Math.min(distance(query, place.shortName), distance(query, place.shortName.slice(0, query.length)));
      return { ...place, score: 3 + errors };
    }).filter((place) => place.score <= 3 + tolerance).sort(compare).slice(0, 8);
  }

  function compare(a, b) {
    const priority = (place) => place.type === "Country / territory" ? 0 : place.type === "State / region" ? 1 : place.type.startsWith("City") ? 2 : 3;
    return a.score - b.score || priority(a) - priority(b) || b.population - a.population || a.name.localeCompare(b.name);
  }

  // Exposed for lightweight regression checks without initializing the dashboard.
  globalThis.GEOINT_PLACE_SEARCH = { suggest, count: entries.length,
    counts: entries.reduce((counts, place) => { counts[place.type] = (counts[place.type] || 0) + 1; return counts; }, {}) };
  globalThis.GEOINT_COUNTRY_SEARCH = { suggest: (value) => suggest(value).map((place) => place.name), count: byCode.size };
  if (typeof document === "undefined") return;
  const input = document.querySelector("#dashboard-address");
  const list = document.querySelector("#country-suggestions");
  if (!input || !list) return;
  let matches = [];
  let selected = 0;
  let navigated = false;

  function close() {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    matches = [];
  }

  function highlight() {
    [...list.children].forEach((option, index) => {
      option.setAttribute("aria-selected", String(index === selected));
    });
    input.setAttribute("aria-activedescendant", `country-option-${selected}`);
    list.children[selected]?.scrollIntoView({ block: "nearest" });
  }

  function complete() {
    const name = matches[selected]?.name;
    if (!name) return;
    input.value = name;
    close();
    input.focus();
    input.setSelectionRange(name.length, name.length);
  }

  function update() {
    matches = suggest(input.value);
    selected = 0;
    navigated = false;
    list.replaceChildren();
    if (!matches.length) return close();
    matches.forEach((place, index) => {
      const option = document.createElement("div");
      option.id = `country-option-${index}`;
      option.setAttribute("role", "option");
      const label = document.createElement("span");
      label.textContent = place.name;
      if (place.flagCode) {
        label.className = "suggestion-country-name";
        const flag = document.createElement("img");
        flag.className = "suggestion-country-flag";
        flag.src = `assets/flags/${encodeURIComponent(place.flagCode)}.png`;
        flag.alt = "";
        flag.addEventListener("error", () => flag.remove(), { once: true });
        label.prepend(flag);
      }
      const type = document.createElement("small");
      type.textContent = place.type;
      option.append(label, type);
      option.addEventListener("pointerdown", (event) => event.preventDefault());
      option.addEventListener("click", () => { selected = index; complete(); });
      list.append(option);
    });
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    highlight();
  }

  input.addEventListener("input", (event) => { if (!event.isComposing) update(); });
  input.addEventListener("compositionstart", close);
  input.addEventListener("compositionend", update);
  input.addEventListener("blur", close);
  input.addEventListener("keydown", (event) => {
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Escape") { close(); return; }
    if (list.hidden) {
      if (event.key === "ArrowDown") { event.preventDefault(); update(); }
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      selected = (selected + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length;
      navigated = true;
      highlight();
    } else if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      complete();
    } else if (event.key === "Enter" && navigated) {
      // Only explicitly chosen suggestions replace text on Enter. A city such
      // as Berlin must not silently become the fuzzy country match Benin.
      complete();
    }
  });
  input.form.addEventListener("submit", close, true);
})();
