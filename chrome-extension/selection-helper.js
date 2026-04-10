function readSelectionFromElement(element) {
  if (!element) {
    return "";
  }

  if (
    (element.tagName === "TEXTAREA" || element.tagName === "INPUT") &&
    typeof element.selectionStart === "number" &&
    typeof element.selectionEnd === "number"
  ) {
    return element.value.slice(element.selectionStart, element.selectionEnd).trim();
  }

  return "";
}

function readWindowSelection(targetWindow) {
  try {
    return (targetWindow.getSelection && targetWindow.getSelection().toString().trim()) || "";
  } catch {
    return "";
  }
}

function readFromFrames(targetWindow) {
  const collected = [];

  for (const frame of Array.from(targetWindow.frames || [])) {
    try {
      const selected = readWindowSelection(frame);
      if (selected) {
        collected.push(selected);
      }

      const activeSelected = readSelectionFromElement(frame.document.activeElement);
      if (activeSelected) {
        collected.push(activeSelected);
      }
    } catch {
      // Ignore inaccessible frames.
    }
  }

  return collected.find(Boolean) || "";
}

function readGoogleDocsSelection() {
  const ownSelection = readWindowSelection(window);
  if (ownSelection) {
    return ownSelection;
  }

  const activeSelection = readSelectionFromElement(document.activeElement);
  if (activeSelection) {
    return activeSelection;
  }

  const docsEventFrame = document.querySelector("iframe.docs-texteventtarget-iframe");
  if (docsEventFrame) {
    try {
      const frameWindow = docsEventFrame.contentWindow;
      const frameDocument = docsEventFrame.contentDocument;
      const frameSelection = readWindowSelection(frameWindow);
      if (frameSelection) {
        return frameSelection;
      }

      const frameActiveSelection = readSelectionFromElement(frameDocument.activeElement);
      if (frameActiveSelection) {
        return frameActiveSelection;
      }
    } catch {
      // Ignore if the frame is not accessible.
    }
  }

  const iframeSelection = readFromFrames(window);
  if (iframeSelection) {
    return iframeSelection;
  }

  return "";
}

function readGenericSelection() {
  const ownSelection = readWindowSelection(window);
  if (ownSelection) {
    return ownSelection;
  }

  const activeSelection = readSelectionFromElement(document.activeElement);
  if (activeSelection) {
    return activeSelection;
  }

  const iframeSelection = readFromFrames(window);
  if (iframeSelection) {
    return iframeSelection;
  }

  return "";
}

function tryCopyFromDocument(targetDocument) {
  try {
    return targetDocument.execCommand("copy");
  } catch {
    return false;
  }
}

function tryCopyGoogleDocsSelection() {
  const docsEventFrame = document.querySelector("iframe.docs-texteventtarget-iframe");

  if (docsEventFrame) {
    try {
      if (tryCopyFromDocument(docsEventFrame.contentDocument)) {
        return true;
      }
    } catch {
      // Ignore inaccessible frame.
    }
  }

  if (tryCopyFromDocument(document)) {
    return true;
  }

  for (const frame of Array.from(window.frames || [])) {
    try {
      if (tryCopyFromDocument(frame.document)) {
        return true;
      }
    } catch {
      // Ignore inaccessible frames.
    }
  }

  return false;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return;
  }

  const isGoogleDocs = window.location.hostname === "docs.google.com";

  if (message.type === "GET_SELECTED_TEXT") {
    sendResponse({
      text: isGoogleDocs ? readGoogleDocsSelection() : readGenericSelection()
    });
    return;
  }

  if (message.type === "TRY_COPY_SELECTION") {
    sendResponse({
      ok: isGoogleDocs ? tryCopyGoogleDocsSelection() : tryCopyFromDocument(document)
    });
  }
});
