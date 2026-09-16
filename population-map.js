const params = new URLSearchParams(location.search);
const searchedLocation = {
  lat: Number(params.get("lat")) || 32.7157,
  lon: Number(params.get("lon")) || -117.1611
};

const continents = [
  { name: "North America", image: "north-america.png", bounds: [-170, 5, -50, 75] },
  { name: "South America", image: "south-america.png", bounds: [-90, -60, -30, 15] },
  { name: "Europe", image: "europe.png", bounds: [-25, 34, 45, 72] },
  { name: "Africa", image: "africa.png", bounds: [-25, -38, 60, 38] },
  { name: "Asia", image: "asia.png", bounds: [25, -10, 180, 80] },
  { name: "Oceania", image: "oceania.png", bounds: [105, -50, 180, 5] },
  { name: "Antarctica", image: "antarctica.png", bounds: [-180, -72, 180, -55] }
];

let continentIndex = findInitialContinent();
const densityMap = document.querySelector("#density-map");
const continentName = document.querySelector("#continent-name");
const continentPosition = document.querySelector("#continent-position");
const continentStrip = document.querySelector("#continent-strip");

const preloadedImages = continents.map((continent) => {
  const image = new Image();
  image.src = `assets/population/${continent.image}`;
  return image;
});

document.querySelector("#continent-previous").addEventListener("click", () => changeContinent(-1));
document.querySelector("#continent-next").addEventListener("click", () => changeContinent(1));

continents.forEach((continent, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = continent.name.replace(" America", " AM.");
  button.addEventListener("click", () => {
    continentIndex = index;
    renderContinent();
  });
  continentStrip.append(button);
});

function findInitialContinent() {
  const match = continents.findIndex(({ bounds }) => {
    const [west, south, east, north] = bounds;
    return searchedLocation.lon >= west
      && searchedLocation.lon <= east
      && searchedLocation.lat >= south
      && searchedLocation.lat <= north;
  });
  return match >= 0 ? match : 0;
}

function changeContinent(direction) {
  continentIndex = (continentIndex + direction + continents.length) % continents.length;
  renderContinent();
}

function renderContinent() {
  const continent = continents[continentIndex];
  densityMap.src = preloadedImages[continentIndex].src;
  densityMap.alt = `${continent.name} population density`;
  continentName.textContent = continent.name.toLocaleUpperCase();
  continentPosition.textContent = `${String(continentIndex + 1).padStart(2, "0")} / ${String(continents.length).padStart(2, "0")}`;

  [...continentStrip.querySelectorAll("button")].forEach((button, index) => {
    button.classList.toggle("is-active", index === continentIndex);
    button.setAttribute("aria-pressed", String(index === continentIndex));
  });
}

renderContinent();
