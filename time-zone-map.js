const params = new URLSearchParams(location.search);
const suppliedOffset = Number(params.get("offset"));
const suppliedLongitude = Number(params.get("lon"));
const hour = Number(params.get("hour"));
const minute = Number(params.get("minute"));
const longitude = Number.isFinite(suppliedOffset)
  ? wrapLongitude(suppliedOffset * 15)
  : wrapLongitude(Number.isFinite(suppliedLongitude) ? suppliedLongitude : 0);
const offset = Number.isFinite(suppliedOffset) ? suppliedOffset : longitude / 15;

const worldMap = document.querySelector("#world-map");
for (let y = 0; y < 2; y += 1) {
  for (let x = 0; x < 4; x += 1) {
    const image = document.createElement("img");
    image.alt = "";
    image.src = `https://tile.opentopomap.org/2/${x}/${y + 1}.png`;
    image.style.left = `${x * 25}%`;
    image.style.top = `${y * 50}%`;
    worldMap.append(image);
  }
}

const centerPercent = (longitude + 180) / 360 * 100;
document.querySelector("#time-band").style.left = `calc(${centerPercent}% - 2.6%)`;
document.querySelector("#time-meridian").style.left = `${centerPercent}%`;
document.querySelector("#offset-label").textContent = `CLOSEST CURRENT OFFSET · UTC${formatUtcOffset(offset)} · ${longitude.toFixed(1)}°`;
if (Number.isFinite(hour) && Number.isFinite(minute)) {
  document.querySelector("#target-time").textContent = `${formatTwelveHourTime(hour, minute)} WORLD BAND`;
}

function formatUtcOffset(value) {
  const sign = value >= 0 ? "+" : "−";
  const absolute = Math.abs(value);
  const hours = Math.floor(absolute);
  const minutes = Math.round((absolute - hours) * 60);
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatTwelveHourTime(value, minutes) {
  return `${value % 12 || 12}:${String(minutes).padStart(2, "0")} ${value >= 12 ? "PM" : "AM"}`;
}

function wrapLongitude(value) {
  return ((value + 180) % 360 + 360) % 360 - 180;
}
