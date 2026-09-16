const MENU_ID = "case-area-prep-selection";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Prepare area for “%s”',
      contexts: ["selection"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;

  const address = info.selectionText.trim();
  chrome.storage.local.set({ activeAddress: address }).then(() => {
    chrome.tabs.create({
      url: chrome.runtime.getURL(`dashboard.html?address=${encodeURIComponent(address)}`)
    });
  });
});
