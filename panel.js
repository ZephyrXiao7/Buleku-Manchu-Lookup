function getParam(name) {
  return new URLSearchParams(window.location.search).get(name) || "";
}

function buildDetailUrl(query) {
  return `https://buleku.org/detail/${encodeURIComponent(query.trim())}`;
}

const selectionEl = document.getElementById("selection");
const queryInput = document.getElementById("query");
const searchButton = document.getElementById("searchButton");
const detailLink = document.getElementById("detailLink");
const homeLink = document.getElementById("homeLink");
const frame = document.getElementById("resultFrame");
const statusEl = document.getElementById("status");
const scriptInfoEl = document.getElementById("scriptInfo");
const tokensSectionEl = document.getElementById("tokensSection");
const tokensEl = document.getElementById("tokens");
const dictionarySectionEl = document.getElementById("dictionarySection");
const dictionaryFormsEl = document.getElementById("dictionaryForms");
const emptyHintEl = document.getElementById("emptyHint");

const originalSelection = getParam("selection");
const initialQuery = getParam("query");
const detectedScript = getParam("script");
const prefillMode = getParam("prefill");

selectionEl.value = originalSelection;
queryInput.value = initialQuery;

if (detectedScript === "manchu") {
  scriptInfoEl.textContent =
    "Detected Manchu script and converted it to Daiqing-style romanization. Edit the query if the copied text needs correction.";
} else if (detectedScript === "latin") {
  scriptInfoEl.textContent =
    "Detected Latin text and normalized it toward Daicing spelling, such as x instead of š, q instead of c, and v instead of û.";
} else {
  scriptInfoEl.textContent =
    "No usable text was detected. Try selecting the word again.";
}

if (!initialQuery && !originalSelection) {
  emptyHintEl.hidden = false;
}

async function prefillFromClipboardIfNeeded() {
  if (prefillMode !== "clipboard" || queryInput.value.trim()) {
    return;
  }

  try {
    const clipboardText = (await navigator.clipboard.readText()).trim();

    if (!clipboardText) {
      return;
    }

    const normalized = ManchuTransliterator.normalizeSelection(clipboardText);
    selectionEl.value = clipboardText;
    queryInput.value = normalized.preferredLookup || normalized.normalized || clipboardText;
    emptyHintEl.hidden = true;
    syncFromSelection(true);
  } catch {
    // Keep the manual fallback visible.
  }
}

function unique(values) {
  return Array.from(new Set(values));
}

function showDictionaryForms(word) {
  const analysis = ManchuTransliterator.analyzeWord(word);
  const forms = unique(
    (analysis.dictionaryForms || []).filter((form) => form && form !== analysis.normalized)
  );

  if (forms.length === 0) {
    dictionarySectionEl.hidden = true;
    dictionaryFormsEl.replaceChildren();
    return;
  }

  dictionarySectionEl.hidden = false;
  dictionaryFormsEl.replaceChildren();

  forms.forEach((form) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "token-button";
    button.textContent = form;
    button.addEventListener("click", () => {
      queryInput.value = form;
      updateLookup();
    });
    dictionaryFormsEl.appendChild(button);
  });
}

function tokenizeSelection(text, script) {
  const raw = (text || "").trim();

  if (!raw) {
    return [];
  }

  if (script === "manchu") {
    return unique(
      raw
        .replace(/[\u1800-\u180A]/g, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean)
    );
  }

  return unique(
    raw
      .split(/[\s,.;:!?()[\]{}"'`/\\|-]+/)
      .map((token) => token.trim())
      .filter(Boolean)
  );
}

function renderTokens(sourceText, sourceScript) {
  const tokens = tokenizeSelection(sourceText, sourceScript);

  if (tokens.length <= 1) {
    tokensSectionEl.hidden = true;
    tokensEl.replaceChildren();
    return;
  }

  tokensSectionEl.hidden = false;
  tokensEl.replaceChildren();

  tokens.forEach((token) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "token-button";
    button.textContent = token;
    button.addEventListener("click", () => {
      queryInput.value = ManchuTransliterator.normalizeSelection(token).preferredLookup;
      showDictionaryForms(token);
      updateLookup();
    });
    tokensEl.appendChild(button);
  });
}

function updateLookup() {
  const query = queryInput.value.trim();

  if (!query) {
    statusEl.textContent = "Enter a query";
    frame.removeAttribute("src");
    detailLink.href = "https://buleku.org/home";
    return;
  }

  const detailUrl = buildDetailUrl(query);
  detailLink.href = detailUrl;
  homeLink.href = "https://buleku.org/home";
  statusEl.textContent = "Loading";
  frame.src = detailUrl;
}

function syncFromSelection(shouldAutosearch = false) {
  const sourceText = selectionEl.value.trim();
  const normalizedSelection = ManchuTransliterator.normalizeSelection(sourceText);

  if (!sourceText) {
    emptyHintEl.hidden = false;
    tokensSectionEl.hidden = true;
    tokensEl.replaceChildren();
    dictionarySectionEl.hidden = true;
    dictionaryFormsEl.replaceChildren();
    queryInput.value = "";
    updateLookup();
    return;
  }

  emptyHintEl.hidden = true;

  const tokens = tokenizeSelection(sourceText, normalizedSelection.detectedScript);
  if (tokens.length > 1 && !shouldAutosearch) {
    queryInput.value = "";
    statusEl.textContent = "Choose a word";
  } else if (!queryInput.value.trim() || shouldAutosearch) {
    queryInput.value = normalizedSelection.preferredLookup || normalizedSelection.normalized || sourceText;
  }

  renderTokens(sourceText, normalizedSelection.detectedScript);
  showDictionaryForms(queryInput.value || sourceText);

  if (shouldAutosearch || queryInput.value.trim()) {
    updateLookup();
  }
}

searchButton.addEventListener("click", updateLookup);
queryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    updateLookup();
  }
});

frame.addEventListener("load", () => {
  statusEl.textContent = "Loaded";
});

frame.addEventListener("error", () => {
  statusEl.textContent = "Could not embed";
});

selectionEl.addEventListener("input", () => {
  syncFromSelection(false);
});

syncFromSelection(Boolean(originalSelection || initialQuery));
prefillFromClipboardIfNeeded();
