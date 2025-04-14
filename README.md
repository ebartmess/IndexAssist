Extension for use with TextEmbedder (https://textembedder.com).

Features:

- Lock a file to prevent changes with Ctrl+Alt+L or Ctrl+Alt+K (Cmd+Opt+K on Mac). All features below except for the unlock feature will lock the file to prevent unwanted changes.
- Unlock a file with Ctrl+Alt+U (Cmd+Opt+U on Mac)
- Copy cursor location or end of highlighted range to clipboard in chapter:line:column format with Ctrl+Alt+P (Cmd+Opt+P on Mac). Filename must have a numeral in it to represent the chapter number; otherwise the chapter number will be "CHAPTERNUMBERNOT FOUND".
- Copy range start and end locations in chapter:line:column-chapter:line:column format with Ctrl+Alt+J (Cmd+Opt+J on Mac).
- Go to file containing a number that matches the clipboard contents: Ctrl+Alt+N (Cmd+Opt+G for Mac).
- Copy selected text or blank if no selected text: Ctrl+Alt+E (Cmd+Opt+E for Mac)
- Read the clipboard for a locator in chapter:line:column format and go to that location: Ctrl+Alt+H (Cmd+Opt+H on Mac). If the locator is a range (e.g., 01:1:1-01:19:1), the entire range will be highlighted.
