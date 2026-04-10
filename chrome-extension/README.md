# Buleku Manchu Lookup for Chrome

This folder contains a Google Chrome version of the Buleku Manchu lookup extension.

## What it does

1. Select Manchu text on a webpage.
2. Right-click the selection.
3. Click `Search selected Manchu in Buleku`.
4. The extension opens a lookup window.
5. If you selected a sentence, it shows clickable word candidates.
6. It normalizes Latin transliteration toward Buleku's Daicing spelling:
   `v` instead of `û/ū`, `x` instead of `š`, and `q` instead of Möllendorff `c`.
7. It also tries to reduce many verb forms to dictionary `-mbi` before search.
8. On Google Docs, it tries to read the live selected text through a Docs-aware content script.
9. If the right-click menu does not appear in Google Docs, click the extension toolbar button instead.

## Install in Chrome

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Turn on `Developer mode`.
4. Click `Load unpacked`.
5. Choose this `chrome-extension` folder.

## Notes

- The context-menu workflow depends on Chrome exposing the selected text to the extension.
- Google Docs support is handled separately because Docs often does not expose selection text through the normal context-menu API.
- In Google Docs, the toolbar button is the most reliable workflow: select text first, then click the extension icon.
- If Docs still hides the live selection, the toolbar flow now also tries a clipboard-based fallback before showing the lookup window.
- PDF support in Chrome can vary depending on the built-in viewer and how selectable the PDF text is.
- If the copied text is messy, you can edit the query manually in the lookup window.
- The extension loads `https://buleku.org/detail/<query>` inline, and the direct link button stays available if embedding becomes unreliable.
