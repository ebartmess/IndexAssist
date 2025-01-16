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
      navigator.clipboard.writeText(clipboardText).then(
        function () {
          console.log("Cursor position copied to clipboard: " + clipboardText);
        },
        function (err) {
          console.error("Could not copy cursor position: ", err);
        }
      );
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
      navigator.clipboard.writeText(clipboardText).then(
        function () {
          console.log("Range copied to clipboard: " + clipboardText);
        },
        function (err) {
          console.error("Could not copy range: ", err);
        }
      );
    }
    lockFile();
  }

  function navigateToPositionFromClipboard() {
    navigator.clipboard
      .readText()
      .then((positionString) => {
        const [chapter, line, column] = positionString.split(":").map(Number);
        const fileNamePattern = new RegExp(`.*${chapter}.*`, "i");

        // Find the file whose name includes the chapter number
        const openFiles = DocumentManager.getAllOpenDocuments();
        const targetFile = openFiles.find((doc) =>
          fileNamePattern.test(doc.file.name)
        );

        if (targetFile) {
          // Open the file
          DocumentManager.getDocumentForPath(targetFile.file.fullPath).done(
            function (doc) {
              DocumentManager.setCurrentDocument(doc);

              // Set the cursor position
              const editor = EditorManager.getCurrentFullEditor();
              editor.setCursorPos(line - 1, column - 1);
            }
          );
        } else {
          console.error(`No open file found with chapter number: ${chapter}`);
        }
      })
      .catch((err) => {
        console.error("Failed to read clipboard contents: ", err);
      });
  }

  // Register the command and add key binding
  const NAVIGATE_TO_POSITION_CMD_ID = "navigateToPositionFromClipboard";
  CommandManager.register(
    "Navigate to Position from Clipboard",
    NAVIGATE_TO_POSITION_CMD_ID,
    navigateToPositionFromClipboard
  );
  // Register the commands and add key bindings
  const LOCK_FILE_CMD_ID = "lockFile";
  const UNLOCK_FILE_CMD_ID = "unlockFile";
  const COPY_CURSOR_POSITION_ID = "copyCursorPosition.copy";
  const COPY_HIGHLIGHTED_RANGE_ID = "copyHighlightedRange.copy";

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

  // Add key bindings
  KeyBindingManager.addBinding(LOCK_FILE_CMD_ID, "Ctrl-Alt-L");
  KeyBindingManager.addBinding(LOCK_FILE_CMD_ID, "Ctrl-Alt-K");
  KeyBindingManager.addBinding(UNLOCK_FILE_CMD_ID, "Ctrl-Alt-U");
  KeyBindingManager.addBinding(COPY_CURSOR_POSITION_ID, "Ctrl-Alt-P");
  KeyBindingManager.addBinding(COPY_HIGHLIGHTED_RANGE_ID, "Ctrl-Alt-J");
  KeyBindingManager.addBinding(NAVIGATE_TO_POSITION_CMD_ID, "Ctrl-Alt-N");
  KeyBindingManager.addBinding(NAVIGATE_TO_POSITION_CMD_ID, "Ctrl-Alt-G");

  KeyBindingManager.addBinding(LOCK_FILE_CMD_ID, "Cmd-Option-L");
  KeyBindingManager.addBinding(LOCK_FILE_CMD_ID, "Cmd-Option-K");
  KeyBindingManager.addBinding(UNLOCK_FILE_CMD_ID, "Cmd-Option-U");
  KeyBindingManager.addBinding(COPY_CURSOR_POSITION_ID, "Cmd-Option-P");
  KeyBindingManager.addBinding(COPY_HIGHLIGHTED_RANGE_ID, "Cmd-Option-J");
  KeyBindingManager.addBinding(NAVIGATE_TO_POSITION_CMD_ID, "Cmd-Option-N");
  KeyBindingManager.addBinding(NAVIGATE_TO_POSITION_CMD_ID, "Cmd-Option-G");

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
