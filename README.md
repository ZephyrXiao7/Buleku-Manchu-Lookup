# Buleku Manchu Lookup for Firefox

This project is a small Firefox WebExtension for looking up selected Manchu words in Buleku.

## Why this is a Firefox extension and not a Greasemonkey script

Firefox renders PDFs in its built-in PDF viewer, and normal userscripts/content scripts do not run there reliably. Because of that, the practical way to support PDF text selection is a Firefox extension that reads the selected text from the browser context menu.

## What it does

1. Select a Manchu word in Firefox, including text inside a PDF.
2. Right-click the selection.
3. Click `Search selected Manchu in Buleku`.
4. The extension opens a small lookup window.
5. If you selected a full sentence, the window shows clickable word candidates from that sentence.
6. For verbs, the add-on tries to recognize common endings and switch to the dictionary form ending in `-mbi`.
7. Click the word you want, or edit the query manually.
8. It opens the matching Buleku entry inline.

## Install in Firefox

1. Open Firefox.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click `Load Temporary Add-on...`.
4. Choose the file `manifest.json` from this folder.

## Notes

- The conversion is best-effort. If the PDF's copied text is imperfect, edit the query in the extension window and search again.
- Latin transliteration is normalized toward Buleku's Daicing spelling, including `v` instead of `û/ū`, `x` instead of `š`, and `q` instead of Möllendorff `c`.
- If you select a whole sentence, the add-on tries to split it into words so you can click the exact word you want to search.
- The verb rules are based on your handouts and cover many common forms such as `-ra/-re/-ro`, `-ha/-he/-ho`, `-ka/-ke/-ko`, `-mbihe`, `-ki`, `-kini`, `-cina`, `-me`, `-fi/-pi`, `-ci`, `-cibe`, negative forms such as `-rakv`, and several other converbs.
- Some forms are ambiguous in Manchu, so the lookup window also shows possible dictionary-form suggestions that you can click if the first automatic guess is not the one you want.
- The inline viewer uses `https://buleku.org/detail/<query>`, so exact dictionary spelling works best.
- If Firefox or Buleku blocks inline embedding in the future, the `Open Buleku entry` button still gives you the direct result page.
