const params = new URLSearchParams(location.search);
const searchedLocation = {
  lat: clamp(Number(params.get("lat")) || 32.7157, -85.0511, 85.0511),
  lon: wrapLongitude(Number(params.get("lon")) || -117.1611)
};

const viewer = document.querySelector("#topographic-viewer");
const tileLayer = document.querySelector("#topographic-tiles");
const coordinateLabel = document.querySelector("#terrain-coordinates");
const zoomLabel = document.querySelector("#terrain-zoom");
let zoom = clamp(Math.round(Number(params.get("zoom")) || 8), 2, 17);
let center = project(searchedLocation.lat, searchedLocation.lon, zoom);
let dragState = null;

document.querySelector("#terrain-zoom-in").addEventListener("click", () => setZoom(zoom + 1));
document.querySelector("#terrain-zoom-out").addEventListener("click", () => setZoom(zoom - 1));
document.querySelector("#terrain-reset").addEventListener("click", () => {
  zoom = clamp(Math.round(Number(params.get("zoom")) || 8), 2, 17);
  center = project(searchedLocation.lat, searchedLocation.lon, zoom);
  renderMap();
});

viewer.addEventListener("wheel", (event) => {
  event.preventDefault();
  setZoom(zoom + (event.deltaY < 0 ? 1 : -1));
}, { passive: false });

viewer.addEventListener("dblclick", (event) => {
  event.preventDefault();
  setZoom(zoom + 1);
});

viewer.addEventListener("pointerdown", (event) => {
  dragState = { x: event.clientX, y: event.clientY, centerX: center.x, centerY: center.y };
  viewer.setPointerCapture(event.pointerId);
  viewer.classList.add("is-dragging");
});

viewer.addEventListener("pointermove", (event) => {
  if (!dragState) return;
  center.x = dragState.centerX - (event.clientX - dragState.x);
  center.y = dragState.centerY - (event.clientY - dragState.y);
  normalizeCenter();
  renderMap();
});

viewer.addEventListener("pointerup", endDrag);
viewer.addEventListener("pointercancel", endDrag);
new ResizeObserver(renderMap).observe(viewer);

function endDrag(event) {
  dragState = null;
  viewer.classList.remove("is-dragging");
  if (viewer.hasPointerCapture(event.pointerId)) viewer.releasePointerCapture(event.pointerId);
}

function setZoom(nextZoom) {
  const bounded = clamp(nextZoom, 2, 17);
  if (bounded === zoom) return;
  const geographicCenter = unproject(center.x, center.y, zoom);
  zoom = bounded;
  center = project(geographicCenter.lat, geographicCenter.lon, zoom);
  renderMap();
}

function renderMap() {
  normalizeCenter();
  const width = viewer.clientWidth;
  const height = viewer.clientHeight;
  if (!width || !height) return;
  const worldTiles = 2 ** zoom;
  const left = center.x - width / 2;
  const top = center.y - height / 2;
  const firstX = Math.floor(left / 256);
  const lastX = Math.floor((left + width) / 256);
  const firstY = Math.max(0, Math.floor(top / 256));
  const lastY = Math.min(worldTiles - 1, Math.floor((top + height) / 256));
  const fragment = document.createDocumentFragment();

  for (let tileY = firstY; tileY <= lastY; tileY += 1) {
    for (let tileX = firstX; tileX <= lastX; tileX += 1) {
      const wrappedX = ((tileX % worldTiles) + worldTiles) % worldTiles;
      const image = document.createElement("img");
      image.alt = "";
      image.draggable = false;
      image.src = `https://tile.opentopomap.org/${zoom}/${wrappedX}/${tileY}.png`;
      image.style.left = `${Math.round(tileX * 256 - left)}px`;
      image.style.top = `${Math.round(tileY * 256 - top)}px`;
      fragment.append(image);
    }
  }

  tileLayer.replaceChildren(fragment);
  const geographicCenter = unproject(center.x, center.y, zoom);
  coordinateLabel.textContent = `${geographicCenter.lat.toFixed(4)} / ${geographicCenter.lon.toFixed(4)}`;
  zoomLabel.textContent = `ZOOM ${String(zoom).padStart(2, "0")} · SCROLL TO ZOOM · DRAG TO PAN`;
}

function normalizeCenter() {
  const worldSize = 256 * 2 ** zoom;
  center.x = ((center.x % worldSize) + worldSize) % worldSize;
  center.y = clamp(center.y, 0, worldSize);
}

function project(lat, lon, level) {
  const scale = 256 * 2 ** level;
  const latitude = clamp(lat, -85.0511, 85.0511);
  const sine = Math.sin(latitude * Math.PI / 180);
  return {
    x: (wrapLongitude(lon) + 180) / 360 * scale,
    y: (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * scale
  };
}

function unproject(x, y, level) {
  const scale = 256 * 2 ** level;
  const lon = x / scale * 360 - 180;
  const mercator = Math.PI - 2 * Math.PI * y / scale;
  return {
    lat: 180 / Math.PI * Math.atan(Math.sinh(mercator)),
    lon: wrapLongitude(lon)
  };
}

function wrapLongitude(value) {
  return ((value + 180) % 360 + 360) % 360 - 180;
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

renderMap();
