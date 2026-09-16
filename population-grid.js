const gridRoot = document.querySelector("#population-grid");
const canvas = document.querySelector("#population-canvas");
const context = canvas.getContext("2d");
const tooltip = document.querySelector("#population-tooltip");
const tooltipName = tooltip.querySelector("strong");
const tooltipPopulation = tooltip.querySelector("span");
const tooltipFlag = document.querySelector("#population-tooltip-flag");
const populationReference = globalThis.POPULATION_REFERENCE?.countries || {};
const countryCentroids = globalThis.COUNTRY_CENTROIDS || {};
const subdivisionGrid = globalThis.SUBDIVISION_GRID || {};

let countries = [];
let hoveredCountry = null;
let zoom = 1;
let pointerX = 0;
let pointerY = 0;
let zoomOriginY = .5;
let horizontalPan = 0;
let dragging = false;
let dragMoved = false;
let dragStartX = 0;
let dragPreviousX = 0;

function formatPopulation(value) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(value >= 1e10 ? 1 : 2).replace(/\.0+$/, "")}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(value >= 1e8 ? 1 : 2).replace(/\.0+$/, "")}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(value >= 1e5 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(value);
}

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
  canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  draw();
}

function project(country) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const baseX = (country.lon + 180) / 360 * width * zoom + horizontalPan;
  const baseY = (90 - country.lat) / 180 * height;
  return {
    x: baseX,
    y: (baseY - height * zoomOriginY) * zoom + height * zoomOriginY
  };
}

function wrappedXs(rawX) {
  const viewportWidth = canvas.clientWidth;
  const worldWidth = viewportWidth * zoom;
  if (!worldWidth) return [rawX];
  const first = rawX - Math.ceil((rawX - viewportWidth) / worldWidth) * worldWidth;
  const positions = [];
  for (let x = first - worldWidth; x <= viewportWidth + worldWidth; x += worldWidth) {
    if (x >= -worldWidth && x <= viewportWidth + worldWidth) positions.push(x);
  }
  return positions;
}

function countrySize(country) {
  const maximum = 1463865525;
  const normalized = Math.sqrt(country.population / maximum);
  return (4 + normalized * 86) * Math.pow(zoom, .42);
}

function draw() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  context.clearRect(0, 0, width, height);
  context.save();
  context.strokeStyle = "rgba(154, 154, 154, .25)";
  context.lineWidth = 1;
  context.beginPath();
  wrappedXs(width * zoom / 2 + horizontalPan).forEach((primeMeridianX) => {
    if (primeMeridianX >= 0 && primeMeridianX <= width) {
      context.moveTo(primeMeridianX, 0);
      context.lineTo(primeMeridianX, height);
    }
  });
  const equatorY = (height / 2 - height * zoomOriginY) * zoom + height * zoomOriginY;
  if (equatorY >= 0 && equatorY <= height) {
    context.moveTo(0, equatorY);
    context.lineTo(width, equatorY);
  }
  context.stroke();
  context.restore();

  const ordered = [...countries].sort((a, b) => b.population - a.population);
  ordered.forEach((country) => {
    const point = project(country);
    const baseSize = countrySize(country);
    const size = country === hoveredCountry ? baseSize * 1.24 : baseSize;
    country.render = wrappedXs(point.x).map((wrappedX) => ({ x: wrappedX - size / 2, y: point.y - size / 2, size }));
    const populationScale = Math.min(1, Math.log10(country.population + 1) / 9.2);
    const grayLevel = Math.round(40 + populationScale * 100);
    country.render.forEach((box) => {
      if (box.x + size < 0 || box.x > width) return;
      context.fillStyle = country === hoveredCountry
        ? "#030303"
        : `rgb(${grayLevel}, ${grayLevel}, ${grayLevel})`;
      context.strokeStyle = country === hoveredCountry ? "#f2f2f2" : "rgba(205, 205, 205, .62)";
      context.lineWidth = country === hoveredCountry ? 2 : 1;
      context.fillRect(box.x, box.y, size, size);
      context.strokeRect(box.x + .5, box.y + .5, Math.max(0, size - 1), Math.max(0, size - 1));
      if (size >= 16) {
        context.fillStyle = country === hoveredCountry ? "#ffffff" : grayLevel > 100 ? "#111111" : "#f1f1f1";
        context.font = `700 ${Math.max(7, Math.min(11, size * .23))}px Consolas, monospace`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(country.code, box.x + size / 2, box.y + size / 2, size - 3);
      }
    });
  });
}

function findCountryAt(x, y) {
  return [...countries]
    .sort((a, b) => a.population - b.population)
    .find((country) => {
      return country.render?.some((box) =>
        x >= box.x && x <= box.x + box.size && y >= box.y && y <= box.y + box.size
      );
    }) || null;
}

function updateHover(event) {
  const bounds = canvas.getBoundingClientRect();
  pointerX = event.clientX - bounds.left;
  pointerY = event.clientY - bounds.top;
  if (dragging) {
    const deltaX = pointerX - dragPreviousX;
    dragPreviousX = pointerX;
    if (Math.abs(pointerX - dragStartX) > 2) dragMoved = true;
    horizontalPan += deltaX;
    const worldWidth = canvas.clientWidth * zoom;
    horizontalPan = ((horizontalPan % worldWidth) + worldWidth) % worldWidth;
    hoveredCountry = null;
    tooltip.hidden = true;
    draw();
    return;
  }
  const next = findCountryAt(pointerX, pointerY);
  if (next !== hoveredCountry) {
    hoveredCountry = next;
    draw();
  }
  if (!hoveredCountry) {
    tooltip.hidden = true;
    return;
  }
  tooltipName.textContent = `${hoveredCountry.name} // ${hoveredCountry.code}`;
  tooltipPopulation.textContent = `${formatPopulation(hoveredCountry.population)} · ${hoveredCountry.type}`;
  const flagCode = hoveredCountry.fullCode || hoveredCountry.code;
  tooltipFlag.hidden = false;
  tooltipFlag.src = `assets/flags/${encodeURIComponent(flagCode)}.png`;
  tooltipFlag.alt = `${hoveredCountry.name} flag`;
  tooltip.hidden = false;
  const left = Math.min(gridRoot.clientWidth - tooltip.offsetWidth - 8, pointerX + 14);
  const top = Math.max(8, Math.min(gridRoot.clientHeight - tooltip.offsetHeight - 8, pointerY - tooltip.offsetHeight / 2));
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function setZoom(nextZoom, originX = .5, originY = .5) {
  const width = canvas.clientWidth;
  const boundedOriginX = Math.max(0, Math.min(1, originX));
  const originPixels = width * boundedOriginX;
  const worldCoordinate = (originPixels - horizontalPan) / (width * zoom);
  const updatedZoom = Math.max(1, Math.min(5, nextZoom));
  horizontalPan = originPixels - worldCoordinate * width * updatedZoom;
  zoom = updatedZoom;
  zoomOriginY = Math.max(0, Math.min(1, originY));
  hoveredCountry = null;
  tooltip.hidden = true;
  draw();
}

canvas.addEventListener("pointermove", updateHover);
canvas.addEventListener("pointerdown", (event) => {
  const bounds = canvas.getBoundingClientRect();
  dragging = true;
  dragMoved = false;
  dragStartX = event.clientX - bounds.left;
  dragPreviousX = dragStartX;
  canvas.setPointerCapture(event.pointerId);
  canvas.classList.add("is-dragging");
});
const finishDrag = (event) => {
  if (!dragging) return;
  dragging = false;
  canvas.classList.remove("is-dragging");
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  if (dragMoved) {
    hoveredCountry = null;
    tooltip.hidden = true;
    draw();
  }
};
canvas.addEventListener("pointerup", finishDrag);
canvas.addEventListener("pointercancel", finishDrag);
canvas.addEventListener("pointerleave", () => {
  if (dragging) return;
  hoveredCountry = null;
  tooltip.hidden = true;
  draw();
});
canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const bounds = canvas.getBoundingClientRect();
  setZoom(zoom * (event.deltaY < 0 ? 1.22 : .82), (event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height);
}, { passive: false });
document.querySelector("#zoom-in").addEventListener("click", () => setZoom(zoom * 1.3));
document.querySelector("#zoom-out").addEventListener("click", () => setZoom(zoom / 1.3));
window.addEventListener("resize", resizeCanvas);
tooltipFlag.addEventListener("error", () => {
  tooltipFlag.hidden = true;
});

countries = Object.entries(populationReference).map(([code, record]) => {
  const center = countryCentroids[code];
  const population = Number(record?.[0]);
  if (!center || !population) return null;
  return {
    code,
    name: record[2] || code,
    population,
    lon: center[0],
    lat: center[1],
    type: "COUNTRY"
  };
}).filter(Boolean);

countries.push(...Object.values(subdivisionGrid).flat().map((record) => ({
  code: record.code.split("-").at(-1),
  fullCode: record.code,
  name: record.name,
  population: Number(record.population),
  lon: Number(record.lon),
  lat: Number(record.lat),
  type: record.type || "STATE / TERRITORY"
})));

if (countries.length) {
  resizeCanvas();
} else {
  tooltip.hidden = false;
  tooltipName.textContent = "POPULATION GRID UNAVAILABLE";
  tooltipPopulation.textContent = "LOCAL DATA COULD NOT LOAD";
  tooltip.style.left = "16px";
  tooltip.style.top = "16px";
}
