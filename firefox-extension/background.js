const MENU_ID = "buleku-manchu-lookup";

function createContextMenu() {
  return browser.contextMenus
    .removeAll()
    .catch(() => {})
    .then(() => {
      browser.contextMenus.create({
        id: MENU_ID,
        title: "Search selected Manchu in Buleku",
        contexts: ["selection"]
      });
    })
    .catch((error) => {
      console.error("Failed to create context menu", error);
    });
}

function openLookupWindow(selectionText) {
  const result = ManchuTransliterator.normalizeSelection(selectionText);

  if (!result.normalized) {
    return;
  }

  const url = browser.runtime.getURL(
    `panel.html?selection=${encodeURIComponent(result.original)}&query=${encodeURIComponent(result.preferredLookup)}&script=${encodeURIComponent(result.detectedScript)}`
  );

  browser.windows.create({
    url,
    type: "popup",
    width: 540,
    height: 760
  });
}

browser.runtime.onInstalled.addListener(createContextMenu);
browser.runtime.onStartup.addListener(createContextMenu);
createContextMenu();

browser.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID) {
    return;
  }

  openLookupWindow(info.selectionText || "");
});
