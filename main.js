/*global define, brackets, $ */

define(function (require, exports, module) {
  ("use strict");

  // Brackets modules
  const AppInit = brackets.getModule("utils/AppInit"),
    CommandManager = brackets.getModule("command/CommandManager"),
    Menus = brackets.getModule("command/Menus"),
    EditorManager = brackets.getModule("editor/EditorManager"),
    KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
    DocumentManager = brackets.getModule("document/DocumentManager");

  // Flag to track if the file is locked
  let isFileLocked = true;

  function lockFile() {
    console.log("File locked");
    const editor = EditorManager.getActiveEditor();
    if (editor) {
      isFileLocked = true;
      editor.on("beforeChange", function (event, editor, change) {
        if (isFileLocked) {
          change.cancel();
        }
      });
    } else {
      console.log("No active editor found");
    }
  }

  // Function to unlock the file
  function unlockFile() {
    console.log(`File unlocked`);
    const editor = EditorManager.getActiveEditor();
    if (editor && isFileLocked) {
      isFileLocked = false;
      editor.off("beforeChange");
    } else {
      console.log("No active editor found or file is not locked");
    }
  }

  function copySelectedText() {
    console.log(`Copying selected text`);
    const editor = EditorManager.getActiveEditor();
    if (editor) {
      const selectedText = editor.getSelectedText();
      const textToCopy = selectedText
        ? selectedText.replace(/\s+/g, " ").trim() // Replace newlines/line breaks with a single space and trim
        : "";
      console.log(`text to copy is ${textToCopy}`);
      Phoenix.app.copyToClipboard(textToCopy);
    }
  }

  // Function to copy the current line and column number to the clipboard
  function copyCursorPosition() {
    unlockFile();
    var editor = EditorManager.getActiveEditor();
    var selectedText = editor.getSelectedText();

    let lineColumn = ``;
    // existing logic for copying cursor position
    if (editor) {
      if (selectedText.length > 0) {
        const selection = editor.getSelection();
        //const start = selection.start;
        const end = selection.end;
        lineColumn = `${end.line + 1}:${end.ch + 1}`;
      } else {
        const cursorPos = editor.getCursorPos();
        lineColumn = `${cursorPos.line + 1}:${cursorPos.ch + 1}`;
      }

      const currentDoc = DocumentManager.getCurrentDocument();
      const filename = currentDoc.file.name;
      const chapterMatch = filename.match(/\d+/);
      const chapterNumber = chapterMatch
        ? chapterMatch[0]
        : "CHAPTERNUMBERNOTFOUND";

      const clipboardText = `${chapterNumber}:${lineColumn}`;
      console.log("Copying cursor position to clipboard: " + clipboardText);

      Phoenix.app.copyToClipboard(clipboardText);
    } else {
      console.log("No active editor found");
    }
    lockFile();
  }

  function copyHighlightedRange() {
    unlockFile();
    const editor = EditorManager.getActiveEditor();
    if (editor) {
      const selection = editor.getSelection();
      const start = selection.start;
      const end = selection.end;

      const currentDoc = DocumentManager.getCurrentDocument();
      const filename = currentDoc.file.name;
      const chapterMatch = filename.match(/\d+/);
      const chapterNumber = chapterMatch
        ? chapterMatch[0]
        : "CHAPTERNUMBERNOTFOUND";

      const startLineColumn = `${start.line + 1}:${start.ch + 1}`;
      const endLineColumn = `${end.line + 1}:${end.ch + 1}`;

      const clipboardText = `${chapterNumber}:${startLineColumn}-${chapterNumber}:${endLineColumn}`;
      console.log("Copying range to clipboard: " + clipboardText);
      Phoenix.app.copyToClipboard(clipboardText);
    }
    lockFile();
  }

  async function switchToFileContainingNumber() {
    const clipboardText = await Phoenix.app.clipboardReadText();
    const numberMatch = clipboardText.match(/^(\d+):/); // Extract number before the first colon
    const number = numberMatch ? numberMatch[1] : null;

    if (!number) {
      console.log("No valid number found in clipboard text");
      return;
    }

    // TODO update windows regex to put the entire locator on the clipboard
    const workingSet = DocumentManager.getWorkingSet();
    const numberPattern = new RegExp(`${number}`);

    for (let i = 0; i < workingSet.length; i++) {
      const file = workingSet[i];
      console.log(
        "checking for number " + number + " in file name = " + file.name
      );
      if (numberPattern.test(file.name)) {
        console.log("Found number in file: " + file.name);
        DocumentManager.getDocumentForPath(file.fullPath).done((doc) => {
          DocumentManager.setCurrentDocument(doc);
        });
        break;
      }
    }
  }

  async function goToAndHighlightRange() {
    const locatorRange = await Phoenix.app.clipboardReadText();
    console.log("Locator range from clipboard: " + locatorRange);
    const rangeParts = locatorRange.split("-");
    if (rangeParts.length !== 2) {
      console.log("Invalid locator range format");
      return;
    }

    const startLocator = rangeParts[0]; // e.g., "06:448:3"
    const endLocator = rangeParts[1]; // e.g., "06:599:37"

    // Extract the file number from the start locator
    const fileMatch = startLocator.match(/^(\d+):/);
    const fileNumber = fileMatch ? fileMatch[1] : null;

    if (!fileNumber) {
      console.log("Invalid file number in locator range");
      return;
    }

    // Switch to the file containing the number
    await switchToFileContainingNumber(`${fileNumber}:`);

    lockFile();

    // Extract line and column numbers from the start and end locators
    const startMatch = startLocator.match(/^\d+:(\d+):(\d+)$/);
    const endMatch = endLocator.match(/^\d+:(\d+):(\d+)$/);

    if (!startMatch || !endMatch) {
      console.log("Invalid line or column numbers in locator range");
      return;
    }

    const startLine = parseInt(startMatch[1], 10) - 1; // Convert to 0-based index
    const startColumn = parseInt(startMatch[2], 10) - 1; // Convert to 0-based index
    const endLine = parseInt(endMatch[1], 10) - 1; // Convert to 0-based index
    const endColumn = parseInt(endMatch[2], 10) - 1; // Convert to 0-based index

    // Get the active editor and set the selection range
    const editor = EditorManager.getActiveEditor();
    if (editor) {
      editor.setSelection(
        { line: startLine, ch: startColumn },
        { line: endLine, ch: endColumn }
      );
    } else {
      console.log("No active editor found");
    }
  }

  async function goToLocationOrHighlightRange() {
    lockFile();
    const locator = await Phoenix.app.clipboardReadText();
    console.log("Locator from clipboard: " + locator);

    if (locator.includes("-")) {
      // Locator is a range
      console.log("Locator is a range");
      const rangeParts = locator.split("-");
      if (rangeParts.length !== 2) {
        console.log("Invalid locator range format");
        return;
      }

      const startLocator = rangeParts[0]; // e.g., "06:448:3"
      const endLocator = rangeParts[1]; // e.g., "06:599:37"

      // Call switchToFileContainingNumber on the first half
      const fileMatch = startLocator.match(/^(\d+):/);
      const fileNumber = fileMatch ? fileMatch[1] : null;

      if (!fileNumber) {
        console.log("Invalid file number in locator range");
        return;
      }

      await switchToFileContainingNumber(`${fileNumber}:`);
      console.log("Switched to file containing number: " + fileNumber);

      // Call goToAndHighlightRange
      await goToAndHighlightRange(locator);
    } else {
      // Locator is a single location
      console.log("Locator is a single location");
      const singleMatch = locator.match(/^(\d+):(\d+):(\d+)$/);
      if (!singleMatch) {
        console.log("Invalid single locator format");
        return;
      }

      const fileNumber = singleMatch[1];
      const line = parseInt(singleMatch[2], 10) - 1; // Convert to 0-based index
      const column = parseInt(singleMatch[3], 10) - 1; // Convert to 0-based index

      // Call switchToFileContainingNumber
      await switchToFileContainingNumber(`${fileNumber}:`);
      console.log("Switched to file containing number: " + fileNumber);

      // Move the cursor to the specified line and column
      const editor = EditorManager.getActiveEditor();
      if (editor) {
        editor.setCursorPos(line, column);
        console.log(`Moved cursor to line ${line + 1}, column ${column + 1}`);
      } else {
        console.log("No active editor found");
      }
    }
  }

  const LOCK_FILE_CMD_ID = "lockFile";
  const UNLOCK_FILE_CMD_ID = "unlockFile";
  const COPY_CURSOR_POSITION_ID = "copyCursorPosition.copy";
  const COPY_HIGHLIGHTED_RANGE_ID = "copyHighlightedRange.copy";
  const SWITCH_TO_FILE_CMD_ID = "switchToFileContainingNumber";
  const COPY_SELECTED_TEXT_CMD_ID = "copySelectedText.copy";
  const GO_TO_LOCATION_OR_HIGHLIGHT_RANGE_CMD_ID =
    "goToLocationOrHighlightRange";

  CommandManager.register("Lock File", LOCK_FILE_CMD_ID, lockFile);
  CommandManager.register("Unlock File", UNLOCK_FILE_CMD_ID, unlockFile);
  CommandManager.register(
    "Copy Cursor Position",
    COPY_CURSOR_POSITION_ID,
    copyCursorPosition
  );
  CommandManager.register(
    "Copy Highlighted Range",
    COPY_HIGHLIGHTED_RANGE_ID,
    copyHighlightedRange
  );
  CommandManager.register(
    "Switch to file containing number",
    SWITCH_TO_FILE_CMD_ID,
    switchToFileContainingNumber
  );
  CommandManager.register(
    "Copy Selected Text",
    COPY_SELECTED_TEXT_CMD_ID,
    copySelectedText
  );
  CommandManager.register(
    "Go to location or highlight range",
    GO_TO_LOCATION_OR_HIGHLIGHT_RANGE_CMD_ID,
    goToLocationOrHighlightRange
  );

  const platform = brackets.platform;
  console.log(`User's operating system: ${platform}`);

  // Add key bindings
  if (platform === "win" || platform === "linux") {
    KeyBindingManager.addBinding(LOCK_FILE_CMD_ID, "Ctrl-Alt-L");
    KeyBindingManager.addBinding(LOCK_FILE_CMD_ID, "Ctrl-Alt-K");
    KeyBindingManager.addBinding(UNLOCK_FILE_CMD_ID, "Ctrl-Alt-U");
    KeyBindingManager.addBinding(COPY_CURSOR_POSITION_ID, "Ctrl-Alt-P");
    KeyBindingManager.addBinding(SWITCH_TO_FILE_CMD_ID, "Ctrl-Alt-J");
    KeyBindingManager.addBinding(SWITCH_TO_FILE_CMD_ID, "Ctrl-Alt-N");
    KeyBindingManager.addBinding(COPY_SELECTED_TEXT_CMD_ID, "Ctrl-Alt-E");
    KeyBindingManager.addBinding(
      GO_TO_LOCATION_OR_HIGHLIGHT_RANGE_CMD_ID,
      "Ctrl-Alt-H"
    );
  } else if (platform === "mac") {
    KeyBindingManager.addBinding(LOCK_FILE_CMD_ID, "Cmd-Opt-K");
    KeyBindingManager.addBinding(UNLOCK_FILE_CMD_ID, "Cmd-Opt-U");
    KeyBindingManager.addBinding(COPY_CURSOR_POSITION_ID, "Cmd-Opt-P");
    KeyBindingManager.addBinding(COPY_HIGHLIGHTED_RANGE_ID, "Cmd-Opt-J");
    KeyBindingManager.addBinding(SWITCH_TO_FILE_CMD_ID, "Cmd-Opt-G");
    KeyBindingManager.addBinding(COPY_SELECTED_TEXT_CMD_ID, "Cmd-Opt-E");
    KeyBindingManager.addBinding(
      GO_TO_LOCATION_OR_HIGHLIGHT_RANGE_CMD_ID,
      "Cmd-Opt-H"
    );
  }

  // Add the commands to the menu
  const menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
  menu.addMenuItem(LOCK_FILE_CMD_ID);
  menu.addMenuItem(UNLOCK_FILE_CMD_ID);
  menu.addMenuItem(COPY_CURSOR_POSITION_ID);
  menu.addMenuItem(COPY_HIGHLIGHTED_RANGE_ID);

  // Initialize extension once shell is finished initializing.
  AppInit.appReady(function () {
    console.log("Extension ready: IndexAssist for TextEmbedder");
  });
});
