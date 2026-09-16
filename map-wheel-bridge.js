const IS_EMBEDDED_MAP = window.top !== window && new URLSearchParams(location.search).get("output") === "embed";

if (IS_EMBEDDED_MAP) {
  let lastZoomAt = 0;
  let accumulatedDelta = 0;
  let resetTimer;

  window.addEventListener("wheel", handleMapWheel, {
    capture: true,
    passive: false
  });

  function handleMapWheel(event) {
    if (event.ctrlKey || event.metaKey) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    accumulatedDelta += event.deltaY;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      accumulatedDelta = 0;
    }, 180);

    const now = Date.now();
    if (now - lastZoomAt < 90 || Math.abs(accumulatedDelta) < 18) return;

    const zoomDirection = accumulatedDelta < 0 ? "in" : "out";
    const button = findZoomButton(zoomDirection);
    if (!button) return;

    button.click();
    lastZoomAt = now;
    accumulatedDelta = 0;
  }

  function findZoomButton(direction) {
    const label = direction === "in" ? "zoom in" : "zoom out";
    return [...document.querySelectorAll("button, [role='button']")].find((element) => {
      const accessibleText = [
        element.getAttribute("aria-label"),
        element.getAttribute("title")
      ].filter(Boolean).join(" ").toLocaleLowerCase();
      return accessibleText.includes(label);
    });
  }
}
