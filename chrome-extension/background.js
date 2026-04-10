importScripts("transliterate.js");

const MENU_ID = "buleku-manchu-lookup";

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "Search selected Manchu in Buleku",
      contexts: ["selection"]
    });
  });
}

function openLookupWindow(selectionText) {
  const result = ManchuTransliterator.normalizeSelection(selectionText);
  const safeSelection = result.original || selectionText || "";
  const safeQuery = result.preferredLookup || result.normalized || "";
  const safeScript = result.detectedScript || "unknown";
  const prefill = !safeSelection && !safeQuery ? "clipboard" : "";

  const url = chrome.runtime.getURL(
    `panel.html?selection=${encodeURIComponent(safeSelection)}&query=${encodeURIComponent(safeQuery)}&script=${encodeURIComponent(safeScript)}&prefill=${encodeURIComponent(prefill)}`
  );

  chrome.windows.create({
    url,
    type: "popup",
    width: 540,
    height: 760
  });
}

function getDocsSelection(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: "GET_SELECTED_TEXT" }, (response) => {
      if (chrome.runtime.lastError) {
        resolve("");
        return;
      }

      resolve((response && response.text) || "");
    });
  });
}

function tryCopySelection(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: "TRY_COPY_SELECTION" }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(false);
        return;
      }

      resolve(Boolean(response && response.ok));
    });
  });
}

function executeSelectionProbe(tabId) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => {
          const active = document.activeElement;

          if (
            active &&
            (active.tagName === "TEXTAREA" || active.tagName === "INPUT") &&
            typeof active.selectionStart === "number" &&
            typeof active.selectionEnd === "number"
          ) {
            return active.value.slice(active.selectionStart, active.selectionEnd).trim();
          }

          return (window.getSelection && window.getSelection().toString().trim()) || "";
        }
      },
      (results) => {
        if (chrome.runtime.lastError) {
          resolve("");
          return;
        }

        resolve((results && results[0] && results[0].result) || "");
      }
    );
  });
}

async function getBestSelection(info, tab) {
  const fallback = info.selectionText || "";

  if (!tab || !tab.id || !tab.url) {
    return fallback;
  }

  if (tab.url.startsWith("https://docs.google.com/")) {
    const docsSelection = await getDocsSelection(tab.id);
    return docsSelection || fallback;
  }

  return fallback;
}

async function getSelectionForToolbar(tab) {
  if (!tab || !tab.id || !tab.url) {
    return "";
  }

  if (tab.url.startsWith("https://docs.google.com/")) {
    const docsSelection = await getDocsSelection(tab.id);
    if (docsSelection) {
      return docsSelection;
    }

    await tryCopySelection(tab.id);
    return "";
  }

  const fromPage = await executeSelectionProbe(tab.id);
  return fromPage || "";
}

chrome.runtime.onInstalled.addListener(createContextMenu);
chrome.runtime.onStartup.addListener(createContextMenu);
createContextMenu();

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID) {
    return;
  }

  const selectionText = await getBestSelection(info, tab);
  openLookupWindow(selectionText);
});

chrome.action.onClicked.addListener(async (tab) => {
  const selectionText = await getSelectionForToolbar(tab);
  openLookupWindow(selectionText);
});
