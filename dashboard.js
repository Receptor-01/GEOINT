const form = document.querySelector("#dashboard-form");
const addressInput = document.querySelector("#dashboard-address");
const caseTitle = document.querySelector("#case-title");
const workspace = document.querySelector("#workspace");
const emptyState = document.querySelector("#empty-state");
const mapWall = document.querySelector("#map-wall");
const mapCarouselNav = document.querySelector("#map-carousel-nav");
const locationFlags = document.querySelector("#location-flags");
const geoShapePanel = document.querySelector("#geo-shape-panel");
let geoShapeImage = document.querySelector("#geo-shape-image");
const geoShapeLabel = document.querySelector("#geo-shape-label");
let activeGeoShapeViews = [];
let activeGeoShapeViewIndex = 0;
const populationPanel = document.querySelector("#population-panel");
const populationCards = document.querySelector("#population-cards");
const populationPanelFill = document.querySelector("#population-panel-fill");
const populationPanelShare = document.querySelector("#population-panel-share");
const populationPanelPercentage = document.querySelector("#population-panel-percentage");
const populationPanelComparison = document.querySelector("#population-panel-comparison");
const populationData = globalThis.POPULATION_REFERENCE || { states: {}, countries: {}, us: null };
const ESTIMATED_WORLD_POPULATION_2025 = 8_231_613_070;
const batteryAnimationFrames = new WeakMap();
const gdpPanel = document.querySelector("#gdp-panel");
const gdpValue = document.querySelector("#gdp-value");
const gdpContext = document.querySelector("#gdp-context");
const gdpShareFill = document.querySelector("#gdp-share-fill");
const gdpShareValue = document.querySelector("#gdp-share-value");
const gdpTrendPath = document.querySelector("#gdp-trend-path");
const gdpTrendEnd = document.querySelector("#gdp-trend-end");
const gdpTrendChange = document.querySelector("#gdp-trend-change");
const gdpTrendYears = document.querySelector("#gdp-trend-years");
const gdpData = globalThis.GDP_REFERENCE || { countries: {}, states: {} };
const establishedPanel = document.querySelector("#established-panel");
const establishedDate = document.querySelector("#established-date");
const establishedEvent = document.querySelector("#established-event");
const establishedPosition = document.querySelector("#established-position");
const establishedData = globalThis.ESTABLISHED_REFERENCE || { countries: {}, states: {} };
let activeEstablishedDates = [];
let establishedDateIndex = 0;
let activeEstablishedName = "";
const capitalPanel = document.querySelector("#capital-panel");
const capitalType = document.querySelector("#capital-type");
const capitalName = document.querySelector("#capital-name");
const capitalRegion = document.querySelector("#capital-region");
let activeCapitalSearch = "";
const currencyPanel = document.querySelector("#currency-panel");
const currencySymbol = document.querySelector("#currency-symbol");
const currencyCode = document.querySelector("#currency-code");
const currencyName = document.querySelector("#currency-name");
const currencyData = globalThis.CURRENCY_REFERENCE || {};
const locationReference = globalThis.LOCATION_REFERENCE || {};
const leadershipData = globalThis.LEADERSHIP_REFERENCE || { asOf: "", countries: {}, states: {} };
const cityData = globalThis.CITY_REFERENCE || { asOf: "", countries: {}, states: {} };
const californiaCountyData = globalThis.CALIFORNIA_COUNTY_REFERENCE || {};
const referencePanel = document.querySelector("#reference-panel");
const referenceToggle = document.querySelector("#reference-toggle");
const briefingToggle = document.querySelector("#briefing-toggle");
const mapPreviewsToggle = document.querySelector("#map-previews-toggle");
const referenceIntelligenceView = document.querySelector("#reference-intelligence-view");
const referenceCodesView = document.querySelector("#reference-codes-view");
const referenceHistoryView = document.querySelector("#reference-history-view");
const referenceViewTitle = document.querySelector("#reference-view-title");
const referenceViewPosition = document.querySelector("#reference-view-position");
const searchHistoryList = document.querySelector("#search-history-list");
const intelligenceScopeLink = document.querySelector("#intelligence-scope-link");
const intelligenceType = document.querySelector("#intelligence-type");
const intelligenceName = document.querySelector("#intelligence-name");
const intelligenceRegion = document.querySelector("#intelligence-region");
const californiaIntelligence = document.querySelector("#california-intelligence");
const californiaCityCounty = document.querySelector("#california-city-county");
const californiaCityList = document.querySelector("#california-city-list");
const leadershipIntelligence = document.querySelector("#leadership-intelligence");
const leadershipCards = document.querySelector("#leadership-cards");
const leadershipVintage = document.querySelector("#leadership-vintage");
const locationNewsIntelligence = document.querySelector("#location-news-intelligence");
const locationNewsLink = document.querySelector("#location-news-link");
const locationImagesLink = document.querySelector("#location-images-link");
const majorCitiesIntelligence = document.querySelector("#major-cities-intelligence");
const majorCityCards = document.querySelector("#major-city-cards");
const majorCitiesVintage = document.querySelector("#major-cities-vintage");
const majorCityPosition = document.querySelector("#major-city-position");
const countyIntelligence = document.querySelector("#county-intelligence");
const countyCards = document.querySelector("#county-cards");
const referenceData = globalThis.AREA_REFERENCE_DATA || { zips: {}, areaCodes: {}, meta: {} };
const primaryZip = document.querySelector("#primary-zip");
const primaryAreaCodes = document.querySelector("#primary-area-codes");
const referenceDetails = document.querySelector("#reference-details");
const referenceDistanceLabel = document.querySelector("#reference-distance-label");
const nearbyZips = document.querySelector("#nearby-zips");
const nearbyAreaCodes = document.querySelector("#nearby-area-codes");
const referenceNotice = document.querySelector("#reference-notice");
const locationClock = document.querySelector("#location-clock");
const clockLocation = document.querySelector("#clock-location");
const clockTime = document.querySelector("#clock-time");
const clockPeriod = document.querySelector("#clock-period");
const clockDate = document.querySelector("#clock-date");
const clockZone = document.querySelector("#clock-zone");
const timeSearchForm = document.querySelector("#time-search-form");
const timeSearchInput = document.querySelector("#time-search-input");
const timeSearchPeriod = document.querySelector("#time-search-period");
const homeClockTime = document.querySelector("#home-clock-time");
const homeClockPeriod = document.querySelector("#home-clock-period");
const homeClockDate = document.querySelector("#home-clock-date");
const homeClockZone = document.querySelector("#home-clock-zone");
const homeLocationReset = document.querySelector("#home-location-reset");
let activeAddress = "";
let geoShapeRequest = 0;
let activeMapId = "satellite";
let mapViewOrder = [];
let clockTimer;
let homeClockTimer;
let activeReferenceView = 0;
let searchHistory = [];
let activeTimeSearch = null;
let majorCityPage = 0;
let activeMajorCities = [];
let activeMajorCityScope = "";

startHomeClock();
initialize();

async function initialize() {
  const params = new URLSearchParams(location.search);
  const stored = await chrome.storage.local.get(["activeAddress", "searchHistory"]);
  searchHistory = Array.isArray(stored.searchHistory) ? stored.searchHistory : [];
  renderSearchHistory();
  const requestedAddress = params.get("address")?.trim();
  const address = requestedAddress || stored.activeAddress || "";
  addressInput.value = address;
  if (address) {
    await routeSearchTerm(address);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const term = addressInput.value.trim();
  if (!term) return addressInput.focus();
  await routeSearchTerm(term);
});

homeLocationReset.addEventListener("click", () => resetToHomeLocation());
homeLocationReset.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  resetToHomeLocation();
});

locationClock.addEventListener("click", (event) => {
  if (event.target.closest("#time-search-form")) return;
  openTimeSearch();
});
locationClock.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && !locationClock.classList.contains("is-editing")) {
    event.preventDefault();
    openTimeSearch();
  }
});
timeSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitTimeSearch();
});
document.querySelector("#time-search-cancel").addEventListener("click", (event) => {
  event.stopPropagation();
  closeTimeSearch();
});

referenceToggle.addEventListener("click", () => {
  setReferencePanelCollapsed(!referencePanel.classList.contains("is-collapsed"));
});
bindTriadKeyboard(referenceToggle);

briefingToggle.addEventListener("click", () => {
  const collapsed = document.body.classList.toggle("briefing-collapsed");
  setTriadSegmentState(briefingToggle, !collapsed);
});
bindTriadKeyboard(briefingToggle);

mapPreviewsToggle.addEventListener("click", () => {
  const collapsed = document.body.classList.toggle("map-previews-collapsed");
  setTriadSegmentState(mapPreviewsToggle, !collapsed);
});
bindTriadKeyboard(mapPreviewsToggle);

document.querySelector("#reference-close").addEventListener("click", () => {
  setReferencePanelCollapsed(true);
});
document.querySelector("#reference-previous").addEventListener("click", () => cycleReferenceView(-1));
document.querySelector("#reference-next").addEventListener("click", () => cycleReferenceView(1));
document.querySelector("#major-city-previous").addEventListener("click", () => cycleMajorCities(-1));
document.querySelector("#major-city-next").addEventListener("click", () => cycleMajorCities(1));
document.querySelector("#clear-search-history").addEventListener("click", async () => {
  searchHistory = [];
  await chrome.storage.local.set({ searchHistory });
  renderSearchHistory();
});

document.querySelector("#zip-lookup-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const code = document.querySelector("#zip-lookup").value.replace(/\D/g, "").slice(0, 5);
  if (code.length !== 5) return showReferenceMessage("Enter a five-digit US ZIP code.");
  await loadZipCode(code);
});

document.querySelector("#area-code-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const code = document.querySelector("#area-code-lookup").value.replace(/\D/g, "").slice(0, 3);
  if (code.length !== 3) return showReferenceMessage("Enter a three-digit phone area code.");
  await loadAreaCode(code);
});

document.querySelector("#map-previous").addEventListener("click", () => cycleMapFocus(-1));
document.querySelector("#map-next").addEventListener("click", () => cycleMapFocus(1));

document.querySelector("#zip-vintage").textContent = `${referenceData.meta?.zctaVintage || "2020"} ZCTA`;
document.querySelector("#nanpa-vintage").textContent = `NANPA ${referenceData.meta?.nanpaFileDate || "LOCAL DATA"}`;
cycleReferenceView(0);

async function routeSearchTerm(term) {
  const clean = term.trim();
  const timeMatch = clean.match(/^time:(\d{2}):(\d{2})$/i);
  if (timeMatch) return loadTimeSearch(Number(timeMatch[1]), Number(timeMatch[2]));
  if (/^\d{5}$/.test(clean)) return loadZipCode(clean);
  if (/^\d{3}$/.test(clean)) return loadAreaCode(clean);
  return loadAddress(clean);
}

function resetToHomeLocation() {
  return routeSearchTerm("Coronado Island, California");
}

async function loadZipCode(code) {
  const record = referenceData.zips[code];
  if (!record) return showReferenceMessage(`ZIP ${code} is not present in the bundled Census ZCTA index.`);
  const [lat, lon, city, state] = record;
  return loadAddress(code, {
    title: `ZIP ${code} · ${city || state || "United States"}`,
    searchTerm: code,
    coordinates: { lat, lon },
    context: {
      zipCode: code,
      city,
      countryCode: "US",
      countryName: "United States",
      subdivisionCode: state ? `US-${state}` : "",
      subdivisionName: state
    }
  });
}

async function loadAreaCode(code) {
  const record = referenceData.areaCodes[code];
  if (!record) return showReferenceMessage(`Area code ${code} is not present in the bundled NANPA index.`);
  if (!record.geo) {
    setReferencePanelCollapsed(false);
    primaryZip.textContent = "-----";
    primaryAreaCodes.textContent = collectRegionalAreaCodes(code, []).slice(0, 3).join(" / ") || code;
    referenceDistanceLabel.textContent = "NON-GEOGRAPHIC CODE";
    renderReferenceChips(nearbyZips, [], loadZipCode);
    renderReferenceChips(
      nearbyAreaCodes,
      collectRegionalAreaCodes(code, []).map((overlayCode) => ({
        code: overlayCode,
        subtitle: referenceData.areaCodes[overlayCode]?.service || "RELATED CODE"
      })),
      loadAreaCode
    );
    renderAreaCodeDetails(code, record);
    return showReferenceMessage(`Area code ${code} is non-geographic or has no regional map center.`);
  }
  const label = record.location || record.areaServed || record.cities?.[0]?.slice(0, 2).join(", ") || "United States";
  return loadAddress(`area code ${code}, ${label}`, {
    title: `AREA CODE ${code} · ${label}`,
    searchTerm: code,
    coordinates: { lat: record.geo[0], lon: record.geo[1] },
    context: {
      areaCode: code,
      countryCode: record.country || "US",
      countryName: record.country === "US" ? "United States" : record.country,
      subdivisionCode: record.country === "US" && /^[A-Z]{2}$/.test(record.location || "")
        ? `US-${record.location}`
        : "",
      subdivisionName: record.location
    }
  });
}

async function loadAddress(address, options = {}) {
  activeTimeSearch = options.timeSearch || null;
  activeAddress = address;
  const requestedAddress = address;
  const searchTerm = options.searchTerm || address;
  addressInput.value = options.inputValue || searchTerm;
  caseTitle.textContent = options.title || address;
  mapCarouselNav.hidden = false;
  workspace.hidden = false;
  emptyState.hidden = true;
  document.title = `${options.title || address} · GEOINT`;
  history.replaceState(null, "", `?address=${encodeURIComponent(searchTerm)}`);
  await chrome.storage.local.set({ activeAddress: searchTerm });
  const coordinates = await renderMapWall(options.coordinates);
  if (activeAddress !== requestedAddress) return;
  majorCityPage = 0;
  await recordSearch(searchTerm, options.title || address);
  const context = options.context || {};
  [
    updateLocationFlags,
    updateGeoShapePanel,
    updateCapitalPanel,
    updateCurrencyPanel,
    updatePopulationPanel,
    updateGdpPanel,
    updateEstablishedPanel,
    updateAreaIntelligence
  ].forEach((update) => {
    try {
      update(coordinates, context);
    } catch (error) {
      console.error(`Location briefing update failed in ${update.name}.`, error);
    }
  });
  await Promise.all([
    activeTimeSearch ? showTimeSearchClock(activeTimeSearch) : startLocationClock(address, coordinates),
    updateAreaReference(coordinates, context)
  ]);
}

function openTimeSearch() {
  locationClock.classList.add("is-editing");
  locationClock.setAttribute("aria-expanded", "true");
  timeSearchForm.hidden = false;
  timeSearchInput.focus();
}

function closeTimeSearch() {
  locationClock.classList.remove("is-editing");
  locationClock.setAttribute("aria-expanded", "false");
  timeSearchForm.hidden = true;
}

async function submitTimeSearch() {
  const match = timeSearchInput.value.trim().match(/^(0?[1-9]|1[0-2]):([0-5]\d)$/);
  if (!match) {
    timeSearchInput.setCustomValidity("Enter a time such as 5:00 or 10:30.");
    timeSearchInput.reportValidity();
    return;
  }
  timeSearchInput.setCustomValidity("");
  const rawHour = Number(match[1]);
  const rawMinute = Number(match[2]);
  let hour = rawHour % 12;
  if (timeSearchPeriod.value === "PM") hour += 12;
  closeTimeSearch();
  await loadTimeSearch(hour, rawMinute);
}

async function loadTimeSearch(hour, minute) {
  const result = resolveTimeBand(hour, minute);
  const displayTime = formatTwelveHourTime(hour, minute);
  await loadAddress(`UTC${formatUtcOffset(result.offset)} time zone`, {
    title: `${displayTime} TIME BAND`,
    searchTerm: `time:${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    inputValue: `${displayTime} WORLD TIME BAND`,
    coordinates: { lat: 20, lon: result.longitude },
    context: {},
    timeSearch: { hour, minute, displayTime, ...result }
  });
  setMapFocus("timezones");
}

function resolveTimeBand(hour, minute) {
  const offsets = [-12, -11, -10, -9.5, -9, -8, -7, -6, -5, -4, -3.5, -3, -2, -1, 0, 1, 2, 3, 3.5, 4, 4.5, 5, 5.5, 5.75, 6, 6.5, 7, 8, 8.75, 9, 9.5, 10, 10.5, 11, 12, 12.75, 13, 14];
  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const targetMinutes = hour * 60 + minute;
  const circularDifference = (left, right) => Math.abs(((left - right + 720) % 1440 + 1440) % 1440 - 720);
  const offset = offsets.reduce((best, candidate) => {
    const candidateTime = ((utcMinutes + candidate * 60) % 1440 + 1440) % 1440;
    return circularDifference(candidateTime, targetMinutes) < circularDifference(((utcMinutes + best * 60) % 1440 + 1440) % 1440, targetMinutes)
      ? candidate
      : best;
  }, offsets[0]);
  return { offset, longitude: ((offset * 15 + 180) % 360 + 360) % 360 - 180 };
}

function formatUtcOffset(offset) {
  const sign = offset >= 0 ? "+" : "−";
  const absolute = Math.abs(offset);
  const hours = Math.floor(absolute);
  const minutes = Math.round((absolute - hours) * 60);
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatTwelveHourTime(hour, minute) {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function showTimeSearchClock(timeSearch) {
  clearInterval(clockTimer);
  locationClock.hidden = false;
  clockLocation.textContent = "REVERSE TIME SEARCH";
  clockTime.textContent = `${String(timeSearch.hour).padStart(2, "0")}:${String(timeSearch.minute).padStart(2, "0")}:00`;
  clockPeriod.textContent = "HRS";
  clockDate.textContent = "APPROXIMATE WORLD BAND";
  clockZone.textContent = `CLOSEST CURRENT OFFSET · UTC${formatUtcOffset(timeSearch.offset)}`;
  showReferenceMessage(`Time-band estimate for ${timeSearch.displayTime}: closest current standard offset UTC${formatUtcOffset(timeSearch.offset)}. Political borders and daylight-saving rules may differ.`);
}

function setReferencePanelCollapsed(collapsed) {
  referencePanel.classList.toggle("is-collapsed", collapsed);
  document.body.classList.toggle("reference-collapsed", collapsed);
  referenceToggle.setAttribute("aria-expanded", String(!collapsed));
  setTriadSegmentState(referenceToggle, !collapsed);
}

function setTriadSegmentState(segment, visible) {
  segment.classList.toggle("is-collapsed", !visible);
  segment.setAttribute("aria-pressed", String(visible));
}

function bindTriadKeyboard(segment) {
  segment.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    segment.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function cycleReferenceView(direction) {
  const viewNames = ["INTEL", "GEOINT", "HISTORY"];
  activeReferenceView = (activeReferenceView + direction + viewNames.length) % viewNames.length;
  referenceIntelligenceView.hidden = activeReferenceView !== 0;
  referenceCodesView.hidden = activeReferenceView !== 1;
  referenceHistoryView.hidden = activeReferenceView !== 2;
  referenceViewPosition.textContent = `0${activeReferenceView + 1} / 03`;
  referenceViewTitle.textContent = viewNames[activeReferenceView];
  document.querySelector("#zip-vintage").textContent = activeReferenceView === 0
    ? "LOCAL STATIC"
    : activeReferenceView === 1
      ? `${referenceData.meta?.zctaVintage || "2020"} ZCTA`
      : `${searchHistory.length} SAVED`;
  document.querySelector("#nanpa-vintage").textContent = activeReferenceView === 0
    ? "CA ENHANCED"
    : activeReferenceView === 1
      ? `NANPA ${referenceData.meta?.nanpaFileDate || "LOCAL DATA"}`
      : "LOCAL DEVICE";
}

async function recordSearch(term, title) {
  const cleanTerm = String(term || "").trim();
  if (!cleanTerm) return;
  const normalized = cleanTerm.toLocaleLowerCase();
  searchHistory = searchHistory.filter((entry) =>
    String(entry.term || "").toLocaleLowerCase() !== normalized
  );
  searchHistory.unshift({
    term: cleanTerm,
    title: String(title || cleanTerm).trim(),
    searchedAt: Date.now()
  });
  await chrome.storage.local.set({ searchHistory });
  renderSearchHistory();
}

function renderSearchHistory() {
  if (!searchHistory.length) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "Your searched locations will appear here.";
    searchHistoryList.replaceChildren(empty);
    return;
  }

  searchHistoryList.replaceChildren(...searchHistory.map((entry, index) => {
    const button = document.createElement("button");
    const number = document.createElement("span");
    const details = document.createElement("span");
    const title = document.createElement("strong");
    const timestamp = document.createElement("small");
    button.type = "button";
    button.title = `Load ${entry.term}`;
    button.setAttribute("aria-label", `Load previous search ${entry.title || entry.term}`);
    number.textContent = String(index + 1).padStart(2, "0");
    title.textContent = entry.title || entry.term;
    timestamp.textContent = entry.searchedAt
      ? new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }).format(new Date(entry.searchedAt)).toLocaleUpperCase()
      : "SAVED SEARCH";
    details.append(title, timestamp);
    button.append(number, details);
    button.addEventListener("click", () => routeSearchTerm(entry.term));
    return button;
  }));
}

function updateAreaIntelligence(coordinates, context = {}) {
  const countryCode = String(context.countryCode || coordinates?.countryCode || "").toLocaleUpperCase();
  const countryName = String(context.countryName || coordinates?.countryName || countryCode || activeAddress || "Unresolved location").trim();
  const subdivisionCode = String(context.subdivisionCode || coordinates?.subdivisionCode || "").toLocaleUpperCase();
  const stateCode = countryCode === "US" && subdivisionCode.startsWith("US-")
    ? subdivisionCode.slice(3)
    : "";
  const stateRecord = stateCode ? populationData.states?.[stateCode] : null;
  const scopeName = stateRecord?.[2]
    || context.subdivisionName
    || coordinates?.subdivisionName
    || countryName;

  intelligenceType.textContent = stateRecord ? "STATE INTELLIGENCE" : "COUNTRY INTELLIGENCE";
  intelligenceName.textContent = scopeName || "Awaiting location";
  intelligenceRegion.textContent = stateRecord ? `${countryName} // ${subdivisionCode}` : countryCode;
  const scopeSearch = scopeName || countryName;
  intelligenceScopeLink.href = `https://www.google.com/search?q=${encodeURIComponent(scopeSearch)}`;
  intelligenceScopeLink.title = `Search Google for ${scopeSearch}`;
  intelligenceScopeLink.setAttribute("aria-label", `Search Google for ${scopeSearch}`);

  renderLeadership(countryCode, stateCode);
  updateLocationNews();
  renderMajorCities(countryCode, stateCode, scopeName, countryName);
  countyIntelligence.hidden = true;

  const isCalifornia = countryCode === "US" && stateCode === "CA";
  if (isCalifornia) majorCitiesIntelligence.hidden = true;
  californiaIntelligence.hidden = !isCalifornia;
  if (!isCalifornia || !coordinates) return;

  const nearest = findNearestRecords(referenceData.zips, Number(coordinates.lat), Number(coordinates.lon), 1, (record) => record)[0];
  const zipRecord = nearest ? referenceData.zips[nearest.code] : null;
  const county = zipRecord?.[5] || "";
  renderCaliforniaCountyContext(coordinates, county);
  renderCaliforniaNearbyCities(coordinates, county);
}

function renderLeadership(countryCode, stateCode) {
  const cards = [];
  const countryLeaders = leadershipData.countries?.[countryCode]?.leaders || [];

  if (countryCode === "US" && stateCode) {
    const stateLeader = leadershipData.states?.[stateCode];
    const president = countryLeaders.find((leader) =>
      leader.roles.some((role) => role.includes("PRESIDENT") || role === "HEAD OF STATE")
    ) || countryLeaders[0];
    if (president?.name) {
      cards.push({ role: "U.S. PRESIDENT", name: president.name });
    }
    if (stateLeader?.governor) {
      cards.push({ role: "GOVERNOR", name: stateLeader.governor });
    }
  } else {
    countryLeaders.slice(0, 4).forEach((leader) => {
      cards.push({
        role: leader.roles.join(" / "),
        name: leader.name
      });
    });
  }

  leadershipCards.replaceChildren(...cards.map(({ role, name }) => {
    const card = document.createElement("a");
    const office = document.createElement("span");
    const leader = document.createElement("strong");
    card.href = `https://www.google.com/search?q=${encodeURIComponent(name)}`;
    card.target = "_blank";
    card.rel = "noopener";
    card.title = `Search Google for ${name}`;
    card.setAttribute("aria-label", `Search Google for ${name}, ${role}`);
    office.textContent = role;
    leader.textContent = name;
    card.append(office, leader);
    return card;
  }));
  leadershipIntelligence.hidden = cards.length === 0;
  if (!leadershipData.asOf) {
    leadershipVintage.textContent = "UNDATED SNAPSHOT";
    return;
  }
  const snapshotDate = new Date(`${leadershipData.asOf}T00:00:00Z`);
  leadershipVintage.textContent = `AS OF ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(snapshotDate).toLocaleUpperCase()}`;
}

function updateLocationNews() {
  const location = String(activeAddress || "").trim();
  locationNewsIntelligence.hidden = !location || Boolean(activeTimeSearch);
  if (!location || activeTimeSearch) return;
  const query = `${location} news`;
  locationNewsLink.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  locationNewsLink.title = `Search Google for ${query}`;
  locationNewsLink.setAttribute("aria-label", `Search Google for news about ${location}`);
  const imageQuery = `${location} images`;
  locationImagesLink.href = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(imageQuery)}`;
  locationImagesLink.title = `Search Google Images for ${location}`;
  locationImagesLink.setAttribute("aria-label", `Search Google Images for ${location}`);
}

function renderMajorCities(countryCode, stateCode, scopeName, countryName) {
  const cities = stateCode ? cityData.states?.[stateCode] : cityData.countries?.[countryCode];
  activeMajorCities = cities || [];
  activeMajorCityScope = stateCode ? scopeName : countryName;
  renderMajorCityPage();
  majorCitiesIntelligence.hidden = activeMajorCities.length === 0;
  majorCitiesVintage.textContent = cityData.asOf ? `SNAPSHOT ${cityData.asOf}` : "POP. ESTIMATES";
}

function renderMajorCityPage() {
  const pageCount = Math.max(1, Math.ceil(activeMajorCities.length / 5));
  majorCityPage = Math.min(Math.max(majorCityPage, 0), pageCount - 1);
  const pageCities = activeMajorCities.slice(majorCityPage * 5, majorCityPage * 5 + 5);
  const cards = pageCities.map(([name, population]) => {
    const button = document.createElement("button");
    const cityName = document.createElement("strong");
    const cityPopulation = document.createElement("span");
    const searchTerm = [name, activeMajorCityScope].filter(Boolean).join(", ");
    button.type = "button";
    button.title = `Load ${searchTerm}`;
    button.setAttribute("aria-label", `Load ${name}, estimated population ${Number(population).toLocaleString()}`);
    cityName.textContent = name;
    cityPopulation.textContent = `POP. ${formatPopulation(population)}`;
    button.append(cityName, cityPopulation);
    button.addEventListener("click", () => loadAddress(searchTerm));
    return button;
  });

  majorCityCards.replaceChildren(...cards);
  majorCityPosition.textContent = `${String(majorCityPage + 1).padStart(2, "0")} / ${String(pageCount).padStart(2, "0")}`;
  document.querySelector("#major-city-previous").disabled = pageCount <= 1;
  document.querySelector("#major-city-next").disabled = pageCount <= 1;
}

function cycleMajorCities(direction) {
  const pageCount = Math.max(1, Math.ceil(activeMajorCities.length / 5));
  if (pageCount <= 1) return;
  majorCityPage = (majorCityPage + direction + pageCount) % pageCount;
  renderMajorCityPage();
}

function renderCaliforniaCountyContext(coordinates, currentCounty) {
  const currentName = String(currentCounty || "").replace(/\s+county$/i, "").trim();
  const latitude = Number(coordinates.lat);
  const longitude = Number(coordinates.lon);
  const counties = Object.entries(californiaCountyData).map(([name, record]) => ({
    name,
    record,
    distance: distanceMiles(latitude, longitude, Number(record[1]), Number(record[2]))
  }));

  counties.sort((left, right) => {
    if (left.name.toLocaleLowerCase() === currentName.toLocaleLowerCase()) return -1;
    if (right.name.toLocaleLowerCase() === currentName.toLocaleLowerCase()) return 1;
    return left.distance - right.distance;
  });

  const cards = counties.slice(0, 3).map(({ name, record, distance }) => {
    const button = document.createElement("button");
    const details = document.createElement("span");
    const countyName = document.createElement("strong");
    const proximity = document.createElement("small");
    const countyPopulation = document.createElement("span");
    const isCurrent = name.toLocaleLowerCase() === currentName.toLocaleLowerCase();
    const searchTerm = `${name} County, California`;
    button.type = "button";
    button.title = `Load ${searchTerm}`;
    button.setAttribute("aria-label", `Load ${searchTerm}, estimated population ${Number(record[0]).toLocaleString()}`);
    countyName.textContent = `${name} County`;
    proximity.textContent = isCurrent ? "CURRENT COUNTY" : `APPROX. ${Math.round(distance)} MI`;
    countyPopulation.textContent = `POP. ${formatPopulation(record[0])}`;
    details.append(countyName, proximity);
    button.append(details, countyPopulation);
    button.addEventListener("click", () => loadAddress(searchTerm));
    return button;
  });

  countyCards.replaceChildren(...cards);
  countyIntelligence.hidden = cards.length === 0;
}

function renderCaliforniaNearbyCities(coordinates, currentCounty) {
  const normalizedCounty = String(currentCounty || "").replace(/\s+county$/i, "").trim().toLocaleLowerCase();
  const latitude = Number(coordinates.lat);
  const longitude = Number(coordinates.lon);
  const cities = new Map();

  Object.entries(referenceData.zips).forEach(([zipCode, record]) => {
    const city = String(record?.[2] || "").trim();
    const state = String(record?.[3] || "").toLocaleUpperCase();
    const county = String(record?.[5] || "").replace(/\s+county$/i, "").trim().toLocaleLowerCase();
    if (!city || state !== "CA" || county !== normalizedCounty) return;
    const distance = distanceMiles(latitude, longitude, Number(record[0]), Number(record[1]));
    const key = city.toLocaleLowerCase();
    const existing = cities.get(key);
    if (!existing || distance < existing.distance) {
      cities.set(key, { city, distance, zipCode });
    }
  });

  const nearby = [...cities.values()]
    .sort((left, right) => left.distance - right.distance || left.city.localeCompare(right.city))
    .slice(0, 8);

  californiaCityCounty.textContent = currentCounty
    ? `${String(currentCounty).replace(/\s+county$/i, "").toLocaleUpperCase()} COUNTY`
    : "CURRENT COUNTY";
  californiaCityList.replaceChildren(...nearby.map(({ city, distance }) => {
    const button = document.createElement("button");
    const bullet = document.createElement("span");
    const name = document.createElement("strong");
    const proximity = document.createElement("small");
    const searchTerm = `${city}, California`;
    button.type = "button";
    button.title = `Load ${searchTerm}`;
    button.setAttribute("aria-label", `Load nearby city ${city}, approximately ${Math.round(distance)} miles away`);
    bullet.textContent = "•";
    name.textContent = city;
    proximity.textContent = distance < 1 ? "LOCAL" : `${Math.round(distance)} MI`;
    button.append(bullet, name, proximity);
    button.addEventListener("click", () => loadAddress(searchTerm));
    return button;
  }));

  if (!nearby.length) {
    const empty = document.createElement("p");
    empty.className = "california-city-empty";
    empty.textContent = "No bundled city references for this county.";
    californiaCityList.replaceChildren(empty);
  }
}

function setDefinitionList(container, rows) {
  container.replaceChildren(...rows.map(([term, description]) => {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = description;
    row.append(dt, dd);
    return row;
  }));
}

async function renderMapWall(providedCoordinates = null) {
  const renderedAddress = activeAddress;
  const contextualView = activeTimeSearch
    ? {
        id: "timezones",
        label: "05 / TIME INTEL",
        title: "World Time Band",
        detail: "Approximate regions sharing the selected local time",
        provider: "LOCAL TIME MODEL",
        dynamic: true
      }
    : {
        id: "fire",
        label: "05 / FIRE WEATHER",
        title: "Fire Danger",
        detail: "Forecast fire-spread danger and regional fuel-weather context",
        provider: "WINDY / CZECHGLOBE",
        dynamic: true
      };
  const views = [
    {
      id: "satellite",
      label: "01 / AERIAL",
      title: "Satellite",
      detail: "Overhead imagery and physical site context",
      provider: "GOOGLE MAPS",
      dynamic: true
    },
    {
      id: "populationgrid",
      label: "02 / DEMOGRAPHICS",
      title: "Population Quadrants",
      detail: "Country squares sized by population and positioned by hemisphere",
      provider: "LOCAL WORLD BANK SNAPSHOT",
      dynamic: true
    },
    {
      id: "openstreetmap",
      label: "03 / OPEN DATA",
      title: "OpenStreetMap",
      detail: "Community-mapped buildings, roads, paths, and features",
      provider: "OPENSTREETMAP",
      dynamic: true
    },
    {
      id: "weather",
      label: "04 / TEMPERATURE",
      title: "Temperature Radar",
      detail: "Current temperature, wind, clouds, and regional conditions",
      provider: "WINDY / ECMWF",
      dynamic: true
    },
    contextualView,
    {
      id: "uvindex",
      label: "06 / SOLAR",
      title: "UV Index",
      detail: "Forecast ultraviolet exposure intensity and regional solar risk",
      provider: "WINDY / ECMWF",
      dynamic: true
    },
    {
      id: "topographic",
      label: "07 / TERRAIN",
      title: "Topographic Terrain",
      detail: "Global contours, relief, waterways, trails, and terrain context",
      provider: "OPENTOPOMAP / OSM",
      dynamic: true
    }
  ];
  mapViewOrder = views.map((view) => view.id);
  if (!mapViewOrder.includes(activeMapId)) activeMapId = mapViewOrder[0];

  mapWall.replaceChildren();
  views.forEach((view) => {
    const encodedQuery = encodeURIComponent(view.query || activeAddress);
    const layer = view.layer ? `&layer=${view.layer}` : "";
    const embedUrl = view.id === "populationgrid"
      ? "population-grid.html"
      : view.dynamic
      ? ""
      : `https://www.google.com/maps?q=${encodedQuery}&z=${view.zoom}&t=${view.mode}&output=embed${layer}`;
    const fullUrl = view.id === "openstreetmap"
      ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(activeAddress)}`
      : view.id === "weather"
        ? `https://www.google.com/search?q=${encodeURIComponent(`weather ${activeAddress}`)}`
        : view.id === "timezones"
          ? "time-zone-map.html"
        : view.id === "fire"
          ? "https://www.windy.com/-Fire-spread-fwi"
        : view.id === "uvindex"
          ? "https://www.windy.com/?uvindex"
        : view.id === "topographic"
          ? "https://www.opentopomap.org/"
        : view.id === "populationgrid"
          ? "population-grid.html"
        : `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
    const monitor = document.createElement("article");
    monitor.className = "map-monitor";
    monitor.dataset.view = view.id;
    monitor.innerHTML = `
      <header class="monitor-header">
        <div class="monitor-title">
          <span>${view.label}</span>
          <strong>${view.title}</strong>
        </div>
        <div class="monitor-actions">
          <div class="map-markup-tools" aria-label="Map screenshot and drawing tools">
            <button type="button" data-map-tool="capture" title="Save visible map screenshot" aria-label="Save visible map screenshot">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5h4l1.4-2h6.2l1.4 2h4v11h-17z"></path><circle cx="12" cy="13" r="3.4"></circle></svg>
            </button>
            <button type="button" data-map-tool="draw" title="Toggle drawing overlay" aria-label="Toggle drawing overlay">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 18 1-4L16.8 3.2l4 4L10 18zM6 14l4 4"></path></svg>
            </button>
            <button type="button" class="map-color is-selected" data-map-color="#111111" title="Black ink" aria-label="Use black ink"></button>
            <button type="button" class="map-color" data-map-color="#ff3030" title="Red ink" aria-label="Use red ink"></button>
            <button type="button" class="map-color" data-map-color="#2e7cff" title="Blue ink" aria-label="Use blue ink"></button>
            <button type="button" data-map-tool="clear" title="Clear drawing" aria-label="Clear drawing">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"></path></svg>
            </button>
          </div>
          <span class="live-indicator">LIVE</span>
          <button class="focus-map" type="button" data-focus-view="${view.id}">FOCUS</button>
          <a href="${fullUrl}" target="_blank" rel="noopener" aria-label="Open ${view.title} full screen">EXPAND ↗</a>
        </div>
      </header>
      <div class="monitor-screen">
        <div class="monitor-loading">
          <span class="loading-reticle"></span>
          <strong>ACQUIRING MAP</strong>
          <small>${view.detail}</small>
        </div>
        <iframe
          title="${view.title} map"
          ${embedUrl ? `src="${embedUrl}"` : ""}
          loading="eager"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen>
        </iframe>
        <canvas class="map-drawing-canvas" aria-label="Map drawing overlay"></canvas>
      </div>
      <footer class="monitor-footer">
        <span>${view.detail}</span>
        <span>${view.provider || "GOOGLE MAPS"}</span>
      </footer>
    `;
    const frame = monitor.querySelector("iframe");
    frame.addEventListener("load", () => monitor.classList.add("is-loaded"));
    monitor.querySelector(".focus-map").addEventListener("click", () => setMapFocus(view.id));
    initializeMapMarkup(monitor, view);
    mapWall.append(monitor);
  });
  setMapFocus(activeMapId);

  try {
    const coordinates = providedCoordinates || await getCoordinates(renderedAddress);
    const { lat, lon } = coordinates;
    if (activeAddress !== renderedAddress) return null;

    const latitude = Number(lat);
    const longitude = Number(lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error("The resolved location did not include valid coordinates.");
    }

    const satelliteZoom = getSatelliteZoom(renderedAddress, coordinates);
    const satelliteCenter = `${latitude},${longitude}`;
    loadCoordinateView(
      "satellite",
      `https://www.google.com/maps?q=${encodeURIComponent(satelliteCenter)}&z=${satelliteZoom}&t=k&output=embed`
    );
    setCoordinateViewLink(
      "satellite",
      `https://www.google.com/maps/@?api=1&map_action=map&center=${encodeURIComponent(satelliteCenter)}&zoom=${satelliteZoom}&basemap=satellite`
    );

    loadCoordinateView(
      "weather",
      `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=650&height=450&zoom=9&level=surface&overlay=temp&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=mph&metricTemp=%C2%B0F&radarRange=-1`
    );

    const uvIndexUrl = `https://embed.windy.com/embed2.html?lat=${latitude}&lon=${longitude}&detailLat=${latitude}&detailLon=${longitude}&width=650&height=450&zoom=8&level=surface&overlay=uvindex&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=mph&metricTemp=%C2%B0F&radarRange=-1`;
    loadCoordinateView("uvindex", uvIndexUrl);
    setCoordinateViewLink("uvindex", `https://www.windy.com/?uvindex,${latitude},${longitude},8`);
    if (activeTimeSearch) {
      const timeZoneUrl = `time-zone-map.html?hour=${activeTimeSearch.hour}&minute=${activeTimeSearch.minute}&offset=${activeTimeSearch.offset}`;
      loadCoordinateView("timezones", timeZoneUrl);
      setCoordinateViewLink("timezones", timeZoneUrl);
    } else {
      const fireDangerUrl = `https://embed.windy.com/embed2.html?lat=${latitude}&lon=${longitude}&detailLat=${latitude}&detailLon=${longitude}&width=650&height=450&zoom=8&level=surface&overlay=fwi&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=mph&metricTemp=%C2%B0F&radarRange=-1`;
      loadCoordinateView("fire", fireDangerUrl);
      setCoordinateViewLink("fire", `https://www.windy.com/-Fire-spread-fwi?fwi,${latitude},${longitude},8`);
    }
    const lonDelta = 0.012;
    const latDelta = 0.008;
    const bbox = [
      longitude - lonDelta,
      latitude - latDelta,
      longitude + lonDelta,
      latitude + latDelta
    ].join(",");
    loadCoordinateView(
      "openstreetmap",
      `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`
    );
    const topographicUrl = `topographic-map.html?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=8`;
    loadCoordinateView("topographic", topographicUrl);
    setCoordinateViewLink("topographic", `https://www.opentopomap.org/#map=8/${latitude}/${longitude}`);
    return coordinates;
  } catch {
    showCoordinateError("satellite");
    showCoordinateError("weather");
    showCoordinateError("openstreetmap");
    showCoordinateError("uvindex");
    showCoordinateError("topographic");
    showCoordinateError(activeTimeSearch ? "timezones" : "fire");
    return null;
  }
}

function getSatelliteZoom(address, coordinates) {
  const query = String(address || "").trim();
  const normalizedQuery = query.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const normalizedCountry = String(coordinates?.countryName || "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const normalizedSubdivision = String(coordinates?.subdivisionName || "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (normalizedCountry && normalizedQuery === normalizedCountry) return 5;
  if (normalizedSubdivision && normalizedQuery === normalizedSubdivision) return 6;
  if (/\d/.test(query)) return 16;
  if (coordinates?.city) return 10;
  if (coordinates?.subdivisionCode || coordinates?.subdivisionName) return 7;
  return 5;
}

async function updateAreaReference(coordinates, context = {}) {
  if (!coordinates) {
    showReferenceMessage("This location could not be matched to the bundled US reference data.");
    return;
  }
  const lat = Number(coordinates.lat);
  const lon = Number(coordinates.lon);
  const zipMatches = findNearestRecords(referenceData.zips, lat, lon, 7, (record) => record);
  const areaMatches = findNearestRecords(referenceData.areaCodes, lat, lon, 7, (record) => record.geo);
  const selectedZip = context.zipCode || zipMatches[0]?.code;
  const selectedArea = context.areaCode || areaMatches[0]?.code;
  const zipRecord = selectedZip ? referenceData.zips[selectedZip] : null;
  const areaRecord = selectedArea ? referenceData.areaCodes[selectedArea] : null;

  primaryZip.textContent = selectedZip || "-----";
  primaryAreaCodes.textContent = collectRegionalAreaCodes(selectedArea, areaMatches).slice(0, 3).join(" / ") || "---";
  referenceDistanceLabel.textContent = context.zipCode
    ? "DIRECT ZIP LOOKUP"
    : context.areaCode
      ? "DIRECT AREA CODE LOOKUP"
      : zipMatches[0]
        ? `NEAREST ZCTA CENTROID · ${formatMiles(zipMatches[0].miles)}`
        : "OUTSIDE US INDEX";

  if (zipRecord) renderZipDetails(selectedZip, zipRecord, areaRecord);
  else if (areaRecord) renderAreaCodeDetails(selectedArea, areaRecord);

  renderReferenceChips(
    nearbyZips,
    zipMatches.map(({ code, miles }) => ({ code, subtitle: formatMiles(miles) })),
    loadZipCode
  );
  renderReferenceChips(
    nearbyAreaCodes,
    collectRegionalAreaCodes(selectedArea, areaMatches).map((code) => ({
      code,
      subtitle: referenceData.areaCodes[code]?.location || referenceData.areaCodes[code]?.type || "NANPA"
    })),
    loadAreaCode
  );
  referenceNotice.textContent =
    "ZIP results use Census ZCTA centroids. Phone area codes show numbering regions; number portability means they do not prove a person's current location.";
}

function updateLocationFlags(coordinates, context = {}) {
  const countryCode = String(context.countryCode || coordinates?.countryCode || "").toLocaleUpperCase();
  const countryName = context.countryName || coordinates?.countryName || countryCode;
  const subdivisionCode = String(context.subdivisionCode || coordinates?.subdivisionCode || "").toLocaleUpperCase();
  const subdivisionName = context.subdivisionName || coordinates?.subdivisionName || subdivisionCode;
  locationFlags.replaceChildren();

  if (countryCode) {
    locationFlags.append(createLocationFlag(countryCode, countryName, "COUNTRY"));
  }
  if (subdivisionCode && subdivisionCode !== countryCode) {
    locationFlags.append(createLocationFlag(subdivisionCode, subdivisionName, "STATE / REGION"));
  }
  locationFlags.hidden = locationFlags.childElementCount === 0;
}

function createLocationFlag(code, name, type) {
  const item = document.createElement("button");
  item.type = "button";
  item.className = "location-flag";
  const history = Array.isArray(globalThis.FLAG_HISTORY?.[code])
    ? globalThis.FLAG_HISTORY[code].map((entry, index) => ({
      ...entry,
      local: index === 0 ? `assets/flags/${code}.png` : entry.local
    }))
    : [{ name: "CURRENT FLAG", years: "CURRENT", local: `assets/flags/${code}.png` }];
  let historyIndex = 0;
  const failedEntries = new Set();
  const image = document.createElement("img");
  const label = document.createElement("span");
  label.textContent = code;
  const meta = document.createElement("span");
  meta.className = "flag-history-meta";
  const design = document.createElement("strong");
  const years = document.createElement("small");
  meta.append(design, years);

  const showHistoryEntry = (index) => {
    historyIndex = index;
    const entry = history[historyIndex];
    image.src = entry.stars
      ? createAmericanFlagDataUrl(entry.stars)
      : entry.local || `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(entry.file)}`;
    image.alt = `${entry.name}, ${name || code}`;
    design.textContent = entry.name;
    years.textContent = `${entry.years} · ${historyIndex + 1}/${history.length}`;
    item.title = history.length > 1
      ? `${type}: ${name || code} — click for the next historical flag`
      : `${type}: ${name || code} — no bundled historical timeline yet`;
    item.classList.toggle("is-historical", historyIndex > 0);
  };

  image.addEventListener("error", () => {
    failedEntries.add(historyIndex);
    const nextIndex = history.findIndex((_, index) => !failedEntries.has(index));
    if (nextIndex >= 0) showHistoryEntry(nextIndex);
    else {
      item.remove();
      locationFlags.hidden = locationFlags.childElementCount === 0;
    }
  });
  item.addEventListener("click", () => {
    if (history.length < 2) return;
    for (let offset = 1; offset <= history.length; offset += 1) {
      const nextIndex = (historyIndex + offset) % history.length;
      if (!failedEntries.has(nextIndex)) {
        showHistoryEntry(nextIndex);
        break;
      }
    }
  });
  item.append(image, label, meta);
  showHistoryEntry(0);
  return item;
}

function createAmericanFlagDataUrl(starCount) {
  const width = 190;
  const height = 100;
  const stripeHeight = height / 13;
  const cantonWidth = 76;
  const cantonHeight = stripeHeight * 7;
  let rows;
  if (starCount === 50) rows = [6, 5, 6, 5, 6, 5, 6, 5, 6];
  else if (starCount === 49) rows = Array(7).fill(7);
  else if (starCount === 48) rows = Array(6).fill(8);
  else {
    const rowCount = Math.max(3, Math.round(Math.sqrt(starCount * .82)));
    const base = Math.floor(starCount / rowCount);
    const remainder = starCount % rowCount;
    rows = Array.from({ length: rowCount }, (_, index) => base + (index < remainder ? 1 : 0));
  }
  const stars = rows.map((columns, rowIndex) => {
    const y = cantonHeight * (rowIndex + 1) / (rows.length + 1);
    return Array.from({ length: columns }, (_, columnIndex) => {
      const x = cantonWidth * (columnIndex + 1) / (columns + 1);
      return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="1.55" fill="#fff"/>`;
    }).join("");
  }).join("");
  const stripes = Array.from({ length: 13 }, (_, index) =>
    `<rect y="${(index * stripeHeight).toFixed(2)}" width="${width}" height="${(stripeHeight + .2).toFixed(2)}" fill="${index % 2 ? "#fff" : "#b22234"}"/>`
  ).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${stripes}<rect width="${cantonWidth}" height="${cantonHeight.toFixed(2)}" fill="#3c3b6e"/>${stars}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function updateGeoShapePanel(coordinates, context = {}) {
  const requestId = ++geoShapeRequest;
  const countryCode = String(context.countryCode || coordinates?.countryCode || "").toLocaleUpperCase();
  const countryName = String(context.countryName || coordinates?.countryName || countryCode).trim();
  const subdivisionCode = String(context.subdivisionCode || coordinates?.subdivisionCode || "").toLocaleUpperCase();
  const subdivisionName = String(context.subdivisionName || coordinates?.subdivisionName || "").trim();
  const stateCode = countryCode === "US" && subdivisionCode.startsWith("US-")
    ? subdivisionCode.slice(3)
    : "";
  const primaryCode = stateCode || countryCode;
  const primaryFolder = stateCode ? "states" : "countries";
  const label = stateCode ? (subdivisionName || stateCode) : (countryName || countryCode);

  geoShapePanel.hidden = true;
  activeGeoShapeViewIndex = 0;
  activeGeoShapeViews = stateCode
    ? [
      { src: `assets/geo-silhouettes/states/${encodeURIComponent(stateCode)}.png`, label, description: `${label} isolated outline` },
      { src: `assets/geo-silhouettes/state-context/${encodeURIComponent(stateCode)}.png`, label: `${stateCode} // U.S.`, description: `${label} position within the United States` }
    ]
    : [
      { src: `assets/geo-silhouettes/countries/${encodeURIComponent(countryCode)}.png`, label, description: `${label} isolated outline` },
      { src: `assets/geo-silhouettes/country-context/${encodeURIComponent(countryCode)}.png`, label: `${countryCode} // CONTINENT`, description: `${label} position within its continent` }
    ];
  const latitude = Number(context.lat ?? coordinates?.lat);
  const longitude = Number(context.lon ?? coordinates?.lon);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    const northSouthCode = latitude >= 0 ? "N" : "S";
    const eastWestCode = longitude >= 0 ? "E" : "W";
    const northSouthLabel = latitude >= 0 ? "NORTHERN" : "SOUTHERN";
    const eastWestLabel = longitude >= 0 ? "EASTERN" : "WESTERN";
    activeGeoShapeViews.push({
      src: `assets/geo-silhouettes/hemispheres/${northSouthCode}${eastWestCode}.png`,
      label: `${northSouthLabel} // ${eastWestLabel}`,
      description: `${label} is in the ${northSouthLabel.toLocaleLowerCase()} and ${eastWestLabel.toLocaleLowerCase()} hemispheres`
    });
  }
  geoShapePanel.classList.toggle("is-toggleable", activeGeoShapeViews.length > 1);
  if (!primaryCode) return;

  const nextImage = document.createElement("img");
  nextImage.id = "geo-shape-image";
  nextImage.alt = `${label} geographic outline`;
  nextImage.onload = () => {
    if (requestId !== geoShapeRequest) return;
    geoShapePanel.hidden = false;
  };
  nextImage.onerror = () => {
    if (requestId !== geoShapeRequest) return;
    if (activeGeoShapeViewIndex > 0) {
      activeGeoShapeViews = activeGeoShapeViews.slice(0, 1);
      activeGeoShapeViewIndex = 0;
      geoShapePanel.classList.remove("is-toggleable");
      geoShapeLabel.textContent = activeGeoShapeViews[0].label;
      nextImage.src = activeGeoShapeViews[0].src;
      return;
    }
    if (stateCode && countryCode) {
      nextImage.onerror = () => {
        if (requestId !== geoShapeRequest) return;
        geoShapePanel.hidden = true;
      };
      nextImage.src = `assets/geo-silhouettes/countries/${encodeURIComponent(countryCode)}.png`;
      geoShapeLabel.textContent = countryName || countryCode;
      return;
    }
    geoShapePanel.hidden = true;
  };
  geoShapeImage.replaceWith(nextImage);
  geoShapeImage = nextImage;
  geoShapeLabel.textContent = activeGeoShapeViews[0].label;
  geoShapePanel.title = activeGeoShapeViews.length > 1
    ? `${activeGeoShapeViews[0].description} — click to show geographic context`
    : activeGeoShapeViews[0].description;
  geoShapePanel.setAttribute("aria-label", geoShapePanel.title);
  nextImage.src = activeGeoShapeViews[0].src;
}

geoShapePanel?.addEventListener("click", () => {
  if (activeGeoShapeViews.length < 2) return;
  activeGeoShapeViewIndex = (activeGeoShapeViewIndex + 1) % activeGeoShapeViews.length;
  const view = activeGeoShapeViews[activeGeoShapeViewIndex];
  geoShapeImage.src = view.src;
  geoShapeLabel.textContent = view.label;
  geoShapePanel.title = `${view.description} — click to ${activeGeoShapeViewIndex ? "show isolated outline" : "show geographic context"}`;
  geoShapePanel.setAttribute("aria-label", geoShapePanel.title);
});

function updateCapitalPanel(coordinates, context = {}) {
  const countryCode = String(context.countryCode || coordinates?.countryCode || "").toLocaleUpperCase();
  const subdivisionCode = String(context.subdivisionCode || coordinates?.subdivisionCode || "").toLocaleUpperCase();
  let record;
  let type = "COUNTRY CAPITAL";

  if (countryCode === "US" && subdivisionCode.startsWith("US-")) {
    record = populationData.states?.[subdivisionCode.slice(3)];
    type = "STATE CAPITAL";
  }
  if (!record) {
    record = populationData.countries?.[countryCode];
    type = countryCode === "US" ? "NATIONAL CAPITAL" : "COUNTRY CAPITAL";
  }

  const capital = record?.[3];
  capitalPanel.hidden = !capital;
  activeCapitalSearch = capital ? [capital, record?.[2]].filter(Boolean).join(", ") : "";
  if (!capital) return;
  capitalType.textContent = type;
  capitalName.textContent = capital;
  capitalRegion.textContent = record[2] || countryCode;
  capitalPanel.title = `${type}: ${capital} — click to load this city`;
  capitalPanel.setAttribute("aria-label", `Load ${activeCapitalSearch}`);
}

capitalPanel?.addEventListener("click", () => {
  if (activeCapitalSearch) loadAddress(activeCapitalSearch);
});

function updateCurrencyPanel(coordinates, context = {}) {
  const countryCode = String(context.countryCode || coordinates?.countryCode || "").toLocaleUpperCase();
  const currencies = currencyData[countryCode] || [];
  const primary = currencies[0];

  currencyPanel.hidden = !primary;
  if (!primary) return;

  const [code, symbol, name] = primary;
  currencySymbol.textContent = symbol || code;
  currencyCode.textContent = code;
  currencyName.textContent = name;
  const conversionQuery = code === "USD"
    ? "USD currency converter"
    : `1 USD to ${code}`;
  currencyPanel.href = `https://www.google.com/search?q=${encodeURIComponent(conversionQuery)}`;
  currencyPanel.setAttribute("aria-label", code === "USD"
    ? "Open the Google USD currency converter"
    : `Convert United States dollars to ${name}, ${code}, in Google`);
  const currencyDescription = currencies.length > 1
    ? `Primary: ${name} (${code}). Also used: ${currencies.slice(1).map((item) => item[0]).join(", ")}`
    : `${name} (${code})`;
  currencyPanel.title = `${currencyDescription} — open Google currency converter`;
}

function updatePopulationPanel(coordinates, context = {}) {
  const countryCode = String(context.countryCode || coordinates?.countryCode || "").toLocaleUpperCase();
  const subdivisionCode = String(context.subdivisionCode || coordinates?.subdivisionCode || "").toLocaleUpperCase();
  const countryRecord = populationData.countries?.[countryCode] || (countryCode === "US" ? populationData.us : null);
  const cityRecord = findCityPopulationRecord(coordinates, context, countryCode, subdivisionCode);
  const cards = [];
  populationPanel.classList.remove("show-share");
  stopBatteryAnimation(populationPanelPercentage);

  if (cityRecord && countryRecord) {
    const [cityName, cityPopulation, , , citySourceDate] = cityRecord;
    const snapshotYear = String(cityData.asOf || citySourceDate || "LOCAL").match(/\d{4}/)?.[0] || "LOCAL";
    cards.push(createPopulationCard(
      [cityPopulation, snapshotYear, cityName],
      cityName,
      {
        comparisonPopulation: Number(countryRecord[0]) || ESTIMATED_WORLD_POPULATION_2025,
        comparisonLabel: countryCode === "US"
          ? "OF U.S. POPULATION"
          : `OF ${countryRecord[2] || countryCode} POPULATION`,
        vintageLabel: `${snapshotYear} SNAPSHOT`,
        titleVintage: `${snapshotYear} bundled city snapshot`
      }
    ));
    cards.push(createPopulationCard(countryRecord, countryCode === "US" ? "USA" : countryCode));
  } else if (countryCode === "US") {
    const stateCode = subdivisionCode.startsWith("US-") ? subdivisionCode.slice(3) : "";
    const stateRecord = populationData.states?.[stateCode];
    if (stateRecord) cards.push(createPopulationCard(stateRecord, stateCode, {
      comparisonPopulation: Number(populationData.us?.[0]) || ESTIMATED_WORLD_POPULATION_2025,
      comparisonLabel: "OF U.S. POPULATION"
    }));
    if (populationData.us) cards.push(createPopulationCard(populationData.us, "USA"));
  } else {
    if (countryRecord) cards.push(createPopulationCard(countryRecord, countryCode));
  }

  populationCards.replaceChildren(...cards);
  populationPanel.hidden = cards.length === 0;
}

function findCityPopulationRecord(coordinates, context, countryCode, subdivisionCode) {
  if (!countryCode || activeTimeSearch) return null;
  const stateCode = countryCode === "US" && subdivisionCode.startsWith("US-")
    ? subdivisionCode.slice(3)
    : "";
  const cityPool = stateCode
    ? cityData.states?.[stateCode]
    : cityData.countries?.[countryCode];
  if (!Array.isArray(cityPool) || cityPool.length === 0) return null;

  const explicitNames = [
    context?.city,
    coordinates?.city,
    coordinates?.town,
    coordinates?.village,
    coordinates?.municipality
  ].filter(Boolean).map(normalizeCityLookupName);
  for (const explicitName of explicitNames) {
    const explicitAlias = explicitName.replace(/\s+city$/, "");
    const exact = cityPool.find(([name]) => {
      const localName = normalizeCityLookupName(name);
      return localName === explicitName || localName.replace(/\s+city$/, "") === explicitAlias;
    });
    if (exact) return exact;
  }

  const searchedLocation = normalizeCityLookupName(activeAddress);
  if (!searchedLocation) return null;
  return [...cityPool]
    .sort((left, right) => String(right[0]).length - String(left[0]).length)
    .find(([name]) => {
      const cityName = normalizeCityLookupName(name);
      return cityName.length >= 3 && (
        searchedLocation === cityName
        || searchedLocation.startsWith(`${cityName} `)
        || searchedLocation.endsWith(` ${cityName}`)
        || searchedLocation.includes(` ${cityName} `)
      );
    }) || null;
}

function normalizeCityLookupName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/\b(?:city of|the city of)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function updateGdpPanel(coordinates, context = {}) {
  const countryCode = String(context.countryCode || coordinates?.countryCode || "").toLocaleUpperCase();
  const subdivisionCode = String(context.subdivisionCode || coordinates?.subdivisionCode || "").toLocaleUpperCase();
  const stateCode = countryCode === "US" && subdivisionCode.startsWith("US-")
    ? subdivisionCode.slice(3)
    : "";
  const record = stateCode ? gdpData.states?.[stateCode] : gdpData.countries?.[countryCode];
  const history = stateCode ? gdpData.history?.states?.[stateCode] : gdpData.history?.countries?.[countryCode];

  stopBatteryAnimation(gdpShareValue);
  gdpPanel.hidden = !record;
  if (!record) return;

  const [value, year, name, source] = record;
  const usGdp = Number(gdpData.countries?.US?.[0]);
  const share = stateCode && usGdp ? Number(value) / usGdp * 100 : 0;
  gdpPanel.classList.remove("show-share");
  gdpPanel.classList.remove("show-trend");
  gdpPanel.classList.toggle("has-share", Boolean(stateCode && usGdp));
  gdpPanel.classList.toggle("has-trend", Array.isArray(history) && history.length > 1);
  gdpPanel.dataset.view = "normal";
  gdpPanel.setAttribute("aria-pressed", "false");
  gdpValue.textContent = formatGdp(value);
  gdpContext.textContent = `${name} · ${year}`;
  gdpPanel.title = `${name}: nominal GDP of approximately ${Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  })} (${year}, ${source})`;
  if (stateCode && usGdp) {
    gdpPanel.dataset.share = String(share);
    gdpPanel.title += `. ${formatPopulationShare(share)} of total U.S. GDP. Click to switch views.`;
  }
  if (Array.isArray(history) && history.length > 1) renderGdpTrend(history);
  gdpPanel.setAttribute("aria-label", gdpPanel.title);
}

gdpPanel?.addEventListener("click", () => {
  const view = gdpPanel.dataset.view || "normal";
  const hasShare = gdpPanel.classList.contains("has-share");
  const hasTrend = gdpPanel.classList.contains("has-trend");
  if (!hasShare && !hasTrend) return;

  if (view === "normal" && hasShare) {
    gdpPanel.classList.add("show-share");
    gdpPanel.dataset.view = "share";
    gdpPanel.setAttribute("aria-pressed", "true");
    animateBatteryDrain(gdpShareFill, gdpShareValue, Number(gdpPanel.dataset.share));
    return;
  }
  if ((view === "normal" || view === "share") && hasTrend) {
    gdpPanel.classList.remove("show-share");
    stopBatteryAnimation(gdpShareValue);
    gdpPanel.classList.add("show-trend");
    gdpPanel.dataset.view = "trend";
    animateGdpTrend();
    return;
  }
  gdpPanel.classList.remove("show-share", "show-trend");
  stopBatteryAnimation(gdpShareValue);
  gdpPanel.dataset.view = "normal";
  gdpPanel.setAttribute("aria-pressed", "false");
});

function renderGdpTrend(history) {
  const points = history
    .map(([year, value]) => [Number(year), Number(value)])
    .filter(([, value]) => Number.isFinite(value))
    .sort((a, b) => a[0] - b[0]);
  if (points.length < 2) return;
  const values = points.map(([, value]) => value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(maximum - minimum, maximum * .03, 1);
  const chartPoints = points.map(([, value], index) => {
    const x = 4 + index / (points.length - 1) * 92;
    const y = 31 - (value - minimum) / range * 25;
    return [x, y];
  });
  gdpTrendPath.setAttribute("d", chartPoints.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" "));
  const [endX, endY] = chartPoints.at(-1);
  gdpTrendEnd.setAttribute("cx", endX);
  gdpTrendEnd.setAttribute("cy", endY);
  const change = (values.at(-1) / values[0] - 1) * 100;
  gdpTrendChange.textContent = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  gdpTrendYears.textContent = `${points[0][0]}—${points.at(-1)[0]}`;
}

function animateGdpTrend() {
  const length = gdpTrendPath.getTotalLength();
  gdpTrendPath.style.transition = "none";
  gdpTrendPath.style.strokeDasharray = String(length);
  gdpTrendPath.style.strokeDashoffset = String(length);
  gdpTrendEnd.style.opacity = "0";
  gdpTrendPath.getBoundingClientRect();
  requestAnimationFrame(() => {
    gdpTrendPath.style.transition = "stroke-dashoffset 1.25s cubic-bezier(.2,.75,.2,1)";
    gdpTrendPath.style.strokeDashoffset = "0";
    gdpTrendEnd.style.opacity = "1";
  });
}

function updateEstablishedPanel(coordinates, context = {}) {
  const countryCode = String(context.countryCode || coordinates?.countryCode || "").toLocaleUpperCase();
  const subdivisionCode = String(context.subdivisionCode || coordinates?.subdivisionCode || "").toLocaleUpperCase();
  const stateCode = countryCode === "US" && subdivisionCode.startsWith("US-")
    ? subdivisionCode.slice(3)
    : "";
  const record = stateCode ? establishedData.states?.[stateCode] : establishedData.countries?.[countryCode];
  activeEstablishedDates = Array.isArray(record?.dates) ? record.dates : [];
  activeEstablishedName = record?.name || "";
  establishedDateIndex = 0;
  establishedPanel.hidden = activeEstablishedDates.length === 0;
  if (activeEstablishedDates.length) renderEstablishedDate();
}

function renderEstablishedDate() {
  const item = activeEstablishedDates[establishedDateIndex];
  if (!item) return;
  establishedDate.textContent = formatEstablishedYear(item.date);
  establishedEvent.textContent = item.event;
  establishedPosition.textContent = activeEstablishedDates.length > 1
    ? `${String(establishedDateIndex + 1).padStart(2, "0")} / ${String(activeEstablishedDates.length).padStart(2, "0")}`
    : "";
  establishedPanel.classList.toggle("has-alternates", activeEstablishedDates.length > 1);
  establishedPanel.title = `${activeEstablishedName || "Location"}: ${item.date} — ${item.event}${activeEstablishedDates.length > 1 ? ". Click to cycle recognized dates." : ""}`;
}

function formatEstablishedYear(date) {
  const match = String(date).match(/\d{3,4}(?:\s+BCE)?/i);
  return match ? match[0].toLocaleUpperCase() : String(date);
}

establishedPanel?.addEventListener("click", () => {
  if (activeEstablishedDates.length < 2) return;
  establishedDateIndex = (establishedDateIndex + 1) % activeEstablishedDates.length;
  renderEstablishedDate();
});

function formatGdp(value) {
  const number = Number(value);
  if (number >= 1_000_000_000_000) {
    const trillions = number / 1_000_000_000_000;
    return `$${trillions.toFixed(trillions >= 10 ? 1 : 2)}T`;
  }
  if (number >= 1_000_000_000) {
    const billions = number / 1_000_000_000;
    return `$${billions.toFixed(billions >= 100 ? 0 : 1)}B`;
  }
  if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(0)}M`;
  return `$${number.toLocaleString("en-US")}`;
}

function createPopulationCard(record, code, options = {}) {
  const [value, year, name] = record;
  const comparisonPopulation = options.comparisonPopulation || ESTIMATED_WORLD_POPULATION_2025;
  const comparisonLabel = options.comparisonLabel || "OF WORLD POPULATION";
  const share = Number(value) / comparisonPopulation * 100;
  const card = document.createElement("button");
  card.type = "button";
  card.className = "population-card";
  card.title = `${name}: approximately ${Number(value).toLocaleString()} residents (${options.titleVintage || `${year} estimate`}). ${formatPopulationShare(share)} ${comparisonLabel.toLocaleLowerCase()}. Click to switch views.`;
  card.setAttribute("aria-label", card.title);
  const number = document.createElement("strong");
  number.textContent = formatPopulation(value);
  const label = document.createElement("span");
  label.textContent = name || code;
  const vintage = document.createElement("small");
  vintage.textContent = options.vintageLabel || `${year} ESTIMATE`;
  card.append(number, label, vintage);
  card.addEventListener("click", () => {
    populationPanelComparison.textContent = comparisonLabel;
    populationPanel.classList.add("show-share");
    animateBatteryDrain(populationPanelFill, populationPanelPercentage, share);
    populationPanelShare.focus({ preventScroll: true });
  });
  return card;
}

populationPanelShare?.addEventListener("click", () => {
  populationPanel.classList.remove("show-share");
  stopBatteryAnimation(populationPanelPercentage);
});

function animateBatteryDrain(fill, valueElement, targetShare) {
  stopBatteryAnimation(valueElement);
  const target = Math.max(0, Math.min(100, Number(targetShare) || 0));
  fill.style.transition = "none";
  fill.style.width = "100%";
  valueElement.textContent = "100%";
  fill.getBoundingClientRect();

  const animationFrame = requestAnimationFrame(() => {
    fill.style.transition = "";
    fill.style.width = `${target}%`;
    const startedAt = performance.now();
    const duration = 1400;

    const countDown = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const current = 100 + (target - 100) * progress;
      valueElement.textContent = progress === 1 ? formatPopulationShare(target) : formatPopulationShare(current);
      if (progress < 1) {
        batteryAnimationFrames.set(valueElement, requestAnimationFrame(countDown));
      } else {
        batteryAnimationFrames.delete(valueElement);
      }
    };
    batteryAnimationFrames.set(valueElement, requestAnimationFrame(countDown));
  });
  batteryAnimationFrames.set(valueElement, animationFrame);
}

function stopBatteryAnimation(valueElement) {
  const frame = batteryAnimationFrames.get(valueElement);
  if (frame) cancelAnimationFrame(frame);
  batteryAnimationFrames.delete(valueElement);
}

function formatPopulationShare(share) {
  if (share >= 10) return `${share.toFixed(1)}%`;
  if (share >= 1) return `${share.toFixed(2)}%`;
  if (share >= .01) return `${share.toFixed(3)}%`;
  return "<0.01%";
}

function formatPopulation(value) {
  const number = Number(value);
  if (number >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(number >= 10_000_000_000 ? 1 : 2)}B`;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(number >= 100_000_000 ? 1 : 2)}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(number >= 100_000 ? 0 : 1)}K`;
  return number.toLocaleString();
}

function findNearestRecords(records, lat, lon, limit, coordinateSelector) {
  const nearest = [];
  for (const [code, record] of Object.entries(records)) {
    const point = coordinateSelector(record);
    if (!point || !Number.isFinite(Number(point[0])) || !Number.isFinite(Number(point[1]))) continue;
    nearest.push({ code, miles: distanceMiles(lat, lon, Number(point[0]), Number(point[1])) });
  }
  nearest.sort((a, b) => a.miles - b.miles);
  return nearest.slice(0, limit);
}

function collectRegionalAreaCodes(selectedArea, areaMatches) {
  const codes = [];
  const add = (code) => {
    if (code && referenceData.areaCodes[code] && !codes.includes(code)) codes.push(code);
  };
  add(selectedArea);
  const overlay = selectedArea ? referenceData.areaCodes[selectedArea]?.overlayComplex : "";
  String(overlay || "").match(/\d{3}/g)?.forEach(add);
  areaMatches.forEach(({ code }) => {
    add(code);
    String(referenceData.areaCodes[code]?.overlayComplex || "").match(/\d{3}/g)?.forEach(add);
  });
  return codes;
}

function renderZipDetails(code, record, areaRecord) {
  const [, , city, state, stateName, county, areaSqMi] = record;
  const place = [city, state].filter(Boolean).join(", ") || stateName || "United States";
  const countyLabel = county ? (/county$/i.test(county) ? county : `${county} County`) : "—";
  setReferenceDetails([
    ["PLACE", place],
    ["COUNTY", countyLabel],
    ["ZCTA AREA", areaSqMi ? `${Number(areaSqMi).toLocaleString()} SQ MI` : "—"],
    ["PHONE REGION", areaRecord?.location || areaRecord?.areaServed || "Nearest mapped NPA"]
  ]);
  document.querySelector("#zip-lookup").value = code;
}

function renderAreaCodeDetails(code, record) {
  primaryAreaCodes.textContent = collectRegionalAreaCodes(code, []).slice(0, 3).join(" / ") || code;
  const cities = [...new Set((record.cities || []).slice(0, 4).map((city) => `${city[0]}, ${city[1]}`))].join(" · ");
  setReferenceDetails([
    ["REGION", record.location || record.areaServed || "Non-geographic"],
    ["MAJOR PLACES", cities || "—"],
    ["TYPE", record.type || record.use || "NANPA"],
    ["STATUS", record.inService === "Y" ? "IN SERVICE" : "NOT IN SERVICE"]
  ]);
  document.querySelector("#area-code-lookup").value = code;
}

function setReferenceDetails(rows) {
  referenceDetails.replaceChildren(...rows.map(([term, description]) => {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = description;
    row.append(dt, dd);
    return row;
  }));
}

function renderReferenceChips(container, items, onClick) {
  container.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("em");
    empty.textContent = "NO LOCAL MATCH";
    container.append(empty);
    return;
  }
  items.forEach(({ code, subtitle }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<strong>${code}</strong><small>${subtitle}</small>`;
    button.addEventListener("click", () => onClick(code));
    container.append(button);
  });
}

function showReferenceMessage(message) {
  setReferencePanelCollapsed(false);
  referenceNotice.textContent = message;
}

function distanceMiles(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatMiles(miles) {
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} MI`;
}

async function startLocationClock(address, coordinates) {
  if (address !== activeAddress) return;
  clearInterval(clockTimer);
  locationClock.hidden = false;
  clockLocation.textContent = getClockLocationLabel();
  clockTime.textContent = "--:--:--";
  clockPeriod.textContent = "HRS";
  clockDate.textContent = "RESOLVING LOCAL DATE…";
  clockZone.textContent = "TIME ZONE LOOKUP";

  if (!coordinates) {
    showClockUnavailable();
    return;
  }

  try {
    const timeZone = await getTimeZone(coordinates);
    if (address !== activeAddress) return;
    const tick = () => updateClockDisplay(timeZone);
    tick();
    clockTimer = setInterval(tick, 1000);
  } catch {
    showClockUnavailable();
  }
}

function getClockLocationLabel() {
  const searchValue = addressInput.value.trim();
  if (/^\d{5}$/.test(searchValue)) return `ZIP ${searchValue}`;
  if (/^\d{3}$/.test(searchValue)) return `AREA CODE ${searchValue}`;
  return "ACTIVE MAP LOCATION";
}

async function getTimeZone({ lat, lon }) {
  const cacheKey = `timezone:${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
  const cached = await chrome.storage.local.get([cacheKey]);
  if (cached[cacheKey]) return cached[cacheKey];

  const endpoint = `https://timeapi.io/api/timezone/coordinate?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error("Time zone lookup failed.");
  const data = await response.json();
  const timeZone = data.timeZone || data.timezone || data.zoneName;
  if (!timeZone) throw new Error("Time zone was not returned.");

  new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
  await chrome.storage.local.set({ [cacheKey]: timeZone });
  return timeZone;
}

function updateClockDisplay(timeZone) {
  const now = new Date();
  const timeParts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(now);
  const part = (type) => timeParts.find((item) => item.type === type)?.value || "";
  clockTime.textContent = `${part("hour")}:${part("minute")}:${part("second")}`;
  clockPeriod.textContent = "HRS";
  clockDate.textContent = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(now).toLocaleUpperCase();
  const zoneAbbreviation = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short"
  }).formatToParts(now).find((item) => item.type === "timeZoneName")?.value || "";
  const zonePlace = timeZone.split("/").at(-1).replaceAll("_", " ");
  clockZone.textContent = `${zonePlace} · ${zoneAbbreviation}`.toLocaleUpperCase();
}

function showClockUnavailable() {
  clearInterval(clockTimer);
  clockTime.textContent = "--:--:--";
  clockPeriod.textContent = "HRS";
  clockDate.textContent = "LOCATION TIME UNAVAILABLE";
  clockZone.textContent = "USE THE ENTERED ADDRESS TO VERIFY ITS TIME ZONE";
}

function startHomeClock() {
  clearInterval(homeClockTimer);
  const tick = () => {
    const timeZone = "America/Los_Angeles";
    const now = new Date();
    const timeParts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(now);
    const part = (type) => timeParts.find((item) => item.type === type)?.value || "";
    homeClockTime.textContent = `${part("hour")}:${part("minute")}:${part("second")}`;
    homeClockPeriod.textContent = "HRS";
    homeClockDate.textContent = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      month: "short",
      day: "numeric"
    }).format(now).toLocaleUpperCase();
    const zoneAbbreviation = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short"
    }).formatToParts(now).find((item) => item.type === "timeZoneName")?.value || "PT";
    homeClockZone.textContent = `PACIFIC TIME · ${zoneAbbreviation}`.toLocaleUpperCase();
  };
  tick();
  homeClockTimer = setInterval(tick, 1000);
}

function cycleMapFocus(direction) {
  if (!mapViewOrder.length) return;
  const currentIndex = mapViewOrder.indexOf(activeMapId);
  const nextIndex = (currentIndex + direction + mapViewOrder.length) % mapViewOrder.length;
  setMapFocus(mapViewOrder[nextIndex]);
}

function initializeMapMarkup(monitor, view) {
  const canvas = monitor.querySelector(".map-drawing-canvas");
  const screen = monitor.querySelector(".monitor-screen");
  const toolbar = monitor.querySelector(".map-markup-tools");
  const drawButton = toolbar.querySelector('[data-map-tool="draw"]');
  const captureButton = toolbar.querySelector('[data-map-tool="capture"]');
  const clearButton = toolbar.querySelector('[data-map-tool="clear"]');
  const colorButtons = [...toolbar.querySelectorAll("[data-map-color]")];
  let drawing = false;
  let inkColor = "#111111";

  const resizeObserver = new ResizeObserver(() => resizeDrawingCanvas(canvas));
  resizeObserver.observe(screen);

  drawButton.addEventListener("click", () => {
    const enabled = canvas.classList.toggle("is-enabled");
    drawButton.classList.toggle("is-active", enabled);
    drawButton.setAttribute("aria-pressed", String(enabled));
  });

  colorButtons.forEach((button) => {
    button.style.setProperty("--ink-color", button.dataset.mapColor);
    button.addEventListener("click", () => {
      inkColor = button.dataset.mapColor;
      colorButtons.forEach((item) => item.classList.toggle("is-selected", item === button));
      canvas.classList.add("is-enabled");
      drawButton.classList.add("is-active");
      drawButton.setAttribute("aria-pressed", "true");
    });
  });

  clearButton.addEventListener("click", () => {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  });

  captureButton.addEventListener("click", async () => {
    captureButton.classList.add("is-working");
    try {
      await captureMapScreenshot(screen, view.title);
      captureButton.classList.add("is-complete");
      setTimeout(() => captureButton.classList.remove("is-complete"), 900);
    } catch (error) {
      console.error("Map screenshot failed.", error);
      captureButton.classList.add("is-error");
      captureButton.title = "Screenshot failed — reload the extension and try again";
      setTimeout(() => captureButton.classList.remove("is-error"), 1200);
    } finally {
      captureButton.classList.remove("is-working");
    }
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (!canvas.classList.contains("is-enabled")) return;
    event.preventDefault();
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const point = canvasPoint(canvas, event);
    const context = canvas.getContext("2d");
    context.beginPath();
    context.moveTo(point.x, point.y);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    event.preventDefault();
    const point = canvasPoint(canvas, event);
    const context = canvas.getContext("2d");
    context.strokeStyle = inkColor;
    context.lineWidth = 4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineTo(point.x, point.y);
    context.stroke();
  });

  const finishDrawing = (event) => {
    if (!drawing) return;
    drawing = false;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener("pointerup", finishDrawing);
  canvas.addEventListener("pointercancel", finishDrawing);
}

function resizeDrawingCanvas(canvas) {
  const width = Math.max(1, Math.round(canvas.clientWidth));
  const height = Math.max(1, Math.round(canvas.clientHeight));
  if (canvas.width === width && canvas.height === height) return;
  const previous = document.createElement("canvas");
  previous.width = canvas.width || width;
  previous.height = canvas.height || height;
  previous.getContext("2d").drawImage(canvas, 0, 0);
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(previous, 0, 0, previous.width, previous.height, 0, 0, width, height);
}

function canvasPoint(canvas, event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) * canvas.width / bounds.width,
    y: (event.clientY - bounds.top) * canvas.height / bounds.height
  };
}

async function captureMapScreenshot(screen, viewTitle) {
  const currentWindow = await new Promise((resolve, reject) => {
    chrome.windows.getCurrent((windowInfo) => {
      const error = chrome.runtime.lastError;
      if (error || !windowInfo?.id) reject(new Error(error?.message || "Unable to identify the dashboard window"));
      else resolve(windowInfo);
    });
  });
  const dataUrl = await new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(currentWindow.id, { format: "png" }, (url) => {
      const error = chrome.runtime.lastError;
      if (error || !url) reject(new Error(error?.message || "No screenshot returned"));
      else resolve(url);
    });
  });
  const image = await loadImage(dataUrl);
  const bounds = screen.getBoundingClientRect();
  const left = Math.max(0, bounds.left);
  const top = Math.max(0, bounds.top);
  const right = Math.min(window.innerWidth, bounds.right);
  const bottom = Math.min(window.innerHeight, bounds.bottom);
  if (right <= left || bottom <= top) throw new Error("The active map is outside the visible window");
  const scaleX = image.naturalWidth / window.innerWidth;
  const scaleY = image.naturalHeight / window.innerHeight;
  const output = document.createElement("canvas");
  output.width = Math.round((right - left) * scaleX);
  output.height = Math.round((bottom - top) * scaleY);
  output.getContext("2d").drawImage(
    image,
    left * scaleX, top * scaleY, output.width, output.height,
    0, 0, output.width, output.height
  );
  const safeLocation = String(activeAddress || "map").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 48);
  const filename = `GEOINT-${viewTitle.replace(/[^a-z0-9]+/gi, "-")}-${safeLocation}-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
  const blob = await new Promise((resolve, reject) => {
    output.toBlob((value) => value ? resolve(value) : reject(new Error("Unable to create the PNG file")), "image/png");
  });
  const downloadUrl = URL.createObjectURL(blob);
  try {
    await new Promise((resolve, reject) => {
      chrome.downloads.download({
        url: downloadUrl,
        filename,
        saveAs: false,
        conflictAction: "uniquify"
      }, (downloadId) => {
        const error = chrome.runtime.lastError;
        if (error || downloadId === undefined) {
          reject(new Error(error?.message || "Chrome did not start the download"));
        } else {
          resolve(downloadId);
        }
      });
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);
  }
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to decode screenshot"));
    image.src = source;
  });
}

function setMapFocus(id) {
  if (!mapViewOrder.includes(id)) return;
  activeMapId = id;
  const monitors = [...mapWall.querySelectorAll(".map-monitor")];
  const activeMonitor = monitors.find((monitor) => monitor.dataset.view === id);
  const activeIndex = mapViewOrder.indexOf(id);
  const visibleSideIds = new Set([1, 2, 3].map((offset) =>
    mapViewOrder[(activeIndex + offset) % mapViewOrder.length]
  ));
  const sideMonitors = monitors.filter((monitor) => visibleSideIds.has(monitor.dataset.view));

  monitors.forEach((monitor) => {
    const isActive = monitor.dataset.view === id;
    const isVisibleSide = visibleSideIds.has(monitor.dataset.view);
    monitor.classList.toggle("is-carousel-hidden", !isActive && !isVisibleSide);
    monitor.classList.toggle("is-active", isActive);
    if (!isActive && !isVisibleSide) return;
    monitor.style.gridColumn = isActive ? "1" : "2";
    monitor.style.gridRow = isActive
      ? "1 / span 3"
      : String(sideMonitors.indexOf(monitor) + 1);
    monitor.querySelector(".focus-map").hidden = isActive;
  });

  const position = mapViewOrder.indexOf(id) + 1;
  mapCarouselNav.querySelector("#map-position").textContent =
    `${String(position).padStart(2, "0")} / ${String(mapViewOrder.length).padStart(2, "0")}`;
  if (activeMonitor) {
    activeMonitor.querySelector(".map-markup-tools").after(mapCarouselNav);
    mapCarouselNav.hidden = false;
    requestAnimationFrame(() => resizeDrawingCanvas(activeMonitor.querySelector(".map-drawing-canvas")));
  }
}

async function getCoordinates(address) {
  const cacheKey = `coordinates:${address.toLocaleLowerCase()}`;
  const cached = await chrome.storage.local.get([cacheKey]);
  if (cached[cacheKey]?.countryCode) {
    const cachedCoordinates = cached[cacheKey];
    if (cachedCoordinates.countryCode !== "US" || cachedCoordinates.subdivisionCode) return cachedCoordinates;
    const repaired = mergeCoordinateContext(cachedCoordinates, findNearestUsCoordinateContext(cachedCoordinates));
    await chrome.storage.local.set({ [cacheKey]: repaired });
    return repaired;
  }

  const normalizedAddress = address.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const localRecord = locationReference[normalizedAddress];
  if (localRecord) {
    const [lat, lon, countryCode, countryName, subdivisionCode, subdivisionName] = localRecord;
    return { lat, lon, countryCode, countryName, subdivisionCode, subdivisionName };
  }

  const localHint = findLocalLocationHint(address);
  const queries = [address];
  if (localHint?.countryCode === "US") {
    const regionalQuery = [address, localHint.subdivisionName, "United States"].filter(Boolean).join(", ");
    if (regionalQuery.toLocaleLowerCase() !== address.toLocaleLowerCase()) queries.push(regionalQuery);
  }

  for (const query of queries) {
    try {
      const coordinates = await searchNominatim(query);
      if (!coordinates) continue;
      const enriched = coordinates.countryCode
        ? coordinates
        : await reverseGeocodeCoordinates(coordinates).catch(() => coordinates);
      const jurisdictionHint = localHint
        || (enriched.countryCode === "US" ? findNearestUsCoordinateContext(enriched) : null);
      const resolved = mergeCoordinateContext(enriched, jurisdictionHint);
      if (resolved.countryCode) {
        await chrome.storage.local.set({ [cacheKey]: resolved });
        return resolved;
      }
    } catch (error) {
      console.warn(`Location lookup attempt failed for ${query}.`, error);
    }
  }

  if (localHint) {
    await chrome.storage.local.set({ [cacheKey]: localHint });
    return localHint;
  }
  throw new Error("Address was not found with jurisdiction context.");
}

async function searchNominatim(query) {
  const endpoint = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(endpoint, { headers: { "Accept-Language": "en-US,en" } });
  if (!response.ok) throw new Error(`Coordinate lookup failed with ${response.status}.`);
  const results = await response.json();
  if (!results.length) return null;
  return coordinatesFromNominatim(results[0]);
}

async function reverseGeocodeCoordinates(coordinates) {
  const endpoint = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(coordinates.lat)}&lon=${encodeURIComponent(coordinates.lon)}`;
  const response = await fetch(endpoint, { headers: { "Accept-Language": "en-US,en" } });
  if (!response.ok) throw new Error(`Reverse location lookup failed with ${response.status}.`);
  const place = await response.json();
  return coordinatesFromNominatim({ ...place, lat: coordinates.lat, lon: coordinates.lon });
}

function coordinatesFromNominatim(place) {
  const placeAddress = place.address || {};
  const countryCode = String(placeAddress.country_code || "").toLocaleUpperCase();
  const stateCode = String(placeAddress["ISO3166-2-lvl4"]
    || placeAddress["ISO3166-2-lvl3"]
    || placeAddress["ISO3166-2-lvl6"]
    || "").toLocaleUpperCase();
  return {
    lat: Number(place.lat),
    lon: Number(place.lon),
    countryCode,
    countryName: placeAddress.country || "",
    subdivisionCode: stateCode,
    subdivisionName: placeAddress.state || placeAddress.region || placeAddress.province || "",
    city: placeAddress.city || placeAddress.town || placeAddress.village || placeAddress.municipality || placeAddress.hamlet || "",
    county: placeAddress.county || ""
  };
}

function findLocalLocationHint(address) {
  const zipMatch = String(address).match(/\b(\d{5})(?:-\d{4})?\b/);
  if (zipMatch && referenceData.zips[zipMatch[1]]) {
    return coordinatesFromZipRecord(referenceData.zips[zipMatch[1]], zipMatch[1]);
  }

  const originalAddress = String(address);
  const normalized = ` ${originalAddress.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
  const addressTerms = new Set([
    "avenue", "boulevard", "circle", "court", "drive", "highway", "lane", "main",
    "parkway", "place", "road", "route", "street", "terrace", "trail", "way"
  ]);
  let bestMatch = null;
  const seenCities = new Set();
  Object.entries(referenceData.zips).forEach(([zipCode, record]) => {
    const city = String(record?.[2] || "").trim();
    const stateCode = String(record?.[3] || "").toLocaleUpperCase();
    if (city.length < 3 || !stateCode) return;
    const cityKey = `${city.toLocaleLowerCase()}|${stateCode}`;
    if (seenCities.has(cityKey)) return;
    seenCities.add(cityKey);
    const normalizedCity = city.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (addressTerms.has(normalizedCity) || !normalized.includes(` ${normalizedCity} `)) return;
    const stateName = String(record?.[4] || "").trim();
    const stateMentioned = new RegExp(`\\b${stateCode}\\b`).test(originalAddress)
      || (stateName && normalized.includes(` ${stateName.toLocaleLowerCase()} `));
    const score = normalizedCity.length + (stateMentioned ? 100 : 0);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { score, coordinates: coordinatesFromZipRecord(record, zipCode) };
    }
  });
  if (bestMatch) return bestMatch.coordinates;

  let globalMatch = null;
  Object.entries(cityData.countries || {}).forEach(([countryCode, cities]) => {
    cities.forEach(([city, , lat, lon]) => {
      const normalizedCity = String(city).toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (normalizedCity.length < 4 || !normalized.includes(` ${normalizedCity} `)) return;
      const countryRecord = populationData.countries?.[countryCode];
      const score = normalizedCity.length;
      if (!globalMatch || score > globalMatch.score) {
        globalMatch = {
          score,
          coordinates: {
            lat: Number(lat),
            lon: Number(lon),
            countryCode,
            countryName: countryRecord?.[2] || countryCode,
            subdivisionCode: "",
            subdivisionName: "",
            city
          }
        };
      }
    });
  });
  return globalMatch?.coordinates || null;
}

function coordinatesFromZipRecord(record, zipCode) {
  const [lat, lon, city, stateCode, stateName, county] = record;
  return {
    lat: Number(lat),
    lon: Number(lon),
    countryCode: "US",
    countryName: "United States",
    subdivisionCode: stateCode ? `US-${stateCode}` : "",
    subdivisionName: stateName || stateCode || "",
    city,
    county,
    zipCode
  };
}

function mergeCoordinateContext(coordinates, context) {
  if (!context) return coordinates;
  return {
    ...coordinates,
    countryCode: coordinates.countryCode || context.countryCode,
    countryName: coordinates.countryName || context.countryName,
    subdivisionCode: coordinates.subdivisionCode || context.subdivisionCode,
    subdivisionName: coordinates.subdivisionName || context.subdivisionName,
    city: coordinates.city || context.city,
    county: coordinates.county || context.county,
    zipCode: coordinates.zipCode || context.zipCode
  };
}

function findNearestUsCoordinateContext(coordinates) {
  const nearest = findNearestRecords(
    referenceData.zips,
    Number(coordinates.lat),
    Number(coordinates.lon),
    1,
    (record) => record
  )[0];
  if (!nearest || nearest.distance > 75) return null;
  return coordinatesFromZipRecord(referenceData.zips[nearest.code], nearest.code);
}

function loadCoordinateView(id, url) {
  const monitor = mapWall.querySelector(`[data-view="${id}"]`);
  const frame = monitor?.querySelector("iframe");
  if (frame) frame.src = url;
}

function setCoordinateViewLink(id, url) {
  const monitor = mapWall.querySelector(`[data-view="${id}"]`);
  const link = monitor?.querySelector(".monitor-actions a");
  if (link) link.href = url;
}

function showCoordinateError(id) {
  const monitor = mapWall.querySelector(`[data-view="${id}"]`);
  const loading = monitor?.querySelector(".monitor-loading");
  if (!loading) return;
  loading.querySelector("strong").textContent = "VIEW UNAVAILABLE";
  loading.querySelector("small").textContent = "The address could not be positioned automatically. Use Expand to open the source.";
  loading.querySelector(".loading-reticle")?.remove();
}
