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
    console.log("lockFile function called");
    const editor = EditorManager.getActiveEditor();
    if (editor) {
      console.log("Editor found, locking file");
      isFileLocked = true;
      editor.on("beforeChange", function (event, editor, change) {
        if (isFileLocked) {
          console.log("File is locked, preventing change");
          change.cancel();
        }
      });
      console.log("File is now read-only.");
    } else {
      console.log("No active editor found");
    }
  }

  // Function to unlock the file
  function unlockFile() {
    console.log("unlockFile function called");
    const editor = EditorManager.getActiveEditor();
    if (editor && isFileLocked) {
      console.log("Editor found, unlocking file");
      isFileLocked = false;
      editor.off("beforeChange");
      console.log("File is now editable.");
    } else {
      console.log("No active editor found or file is not locked");
    }
  }

  // Function to copy the current line and column number to the clipboard
  function copyCursorPosition() {
    lockFile();
    const editor = EditorManager.getActiveEditor();
    if (editor) {
      const cursorPos = editor.getCursorPos();
      const lineColumn = `${cursorPos.line + 1}:${cursorPos.ch + 1}`;

      const currentDoc = DocumentManager.getCurrentDocument();
      const filename = currentDoc.file.name;
      const chapterMatch = filename.match(/\d+/);
      const chapterNumber = chapterMatch
        ? chapterMatch[0]
        : "CHAPTERNUMBERNOTFOUND";

      const clipboardText = `${chapterNumber}:${lineColumn}`;
      navigator.clipboard.writeText(clipboardText).then(
        function () {
          console.log("Copied to clipboard: " + clipboardText);
        },
        function (err) {
          console.error("Could not copy text: ", err);
        }
      );
    } else {
      console.log("No active editor found");
    }
  }

  // Function to copy the current line and column number to the clipboard
  function copyCursorPosition() {
    lockFile();
    const editor = EditorManager.getActiveEditor();
    if (editor) {
      const cursorPos = editor.getCursorPos();
      const lineColumn = `${cursorPos.line + 1}:${cursorPos.ch + 1}`;

      const currentDoc = DocumentManager.getCurrentDocument();
      const filename = currentDoc.file.name;
      const chapterMatch = filename.match(/\d+/);
      const chapterNumber = chapterMatch
        ? chapterMatch[0]
        : "CHAPTERNUMBERNOTFOUND";

      const clipboardText = `${chapterNumber}:${lineColumn}`;
      navigator.clipboard.writeText(clipboardText).then(
        function () {
          console.log("Copied to clipboard: " + clipboardText);
        },
        function (err) {
          console.error("Could not copy text: ", err);
        }
      );
    }
  }

  // Register the commands and add key bindings
  const LOCK_FILE_CMD_ID = "lockFile";
  const UNLOCK_FILE_CMD_ID = "unlockFile";
  const COPY_CURSOR_POSITION_ID = "copyCursorPosition.copy";

  CommandManager.register("Lock File", LOCK_FILE_CMD_ID, lockFile);
  CommandManager.register("Unlock File", UNLOCK_FILE_CMD_ID, unlockFile);
  CommandManager.register(
    "Copy Cursor Position",
    COPY_CURSOR_POSITION_ID,
    copyCursorPosition
  );

  // Add key bindings
  KeyBindingManager.addBinding(LOCK_FILE_CMD_ID, "Ctrl-Alt-L");
  KeyBindingManager.addBinding(UNLOCK_FILE_CMD_ID, "Ctrl-Alt-U");
  KeyBindingManager.addBinding(COPY_CURSOR_POSITION_ID, "Ctrl-Shift-X");

  // Add the commands to the menu
  const menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
  menu.addMenuItem(LOCK_FILE_CMD_ID);
  menu.addMenuItem(UNLOCK_FILE_CMD_ID);
  menu.addMenuItem(COPY_CURSOR_POSITION_ID);

  // Initialize extension once shell is finished initializing.
  AppInit.appReady(function () {
    console.log("Extension ready: IndexAssist for TextEmbedder");
  });
});
