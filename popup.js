document.querySelector("#open-geoint").addEventListener("click", async () => {
  const stored = await chrome.storage.local.get(["activeAddress"]);
  const address = stored.activeAddress || "Coronado Island, California";
  if (!stored.activeAddress) await chrome.storage.local.set({ activeAddress: address });
  chrome.tabs.create({
    url: chrome.runtime.getURL(`dashboard.html?address=${encodeURIComponent(address)}`)
  });
  window.close();
});
