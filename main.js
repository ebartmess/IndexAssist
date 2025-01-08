/*global define, brackets, $ */

define(function (require, exports, module) {
  "use strict";

  // Brackets modules
  const AppInit = brackets.getModule("utils/AppInit"),
    CommandManager = brackets.getModule("command/CommandManager"),
    Menus = brackets.getModule("command/Menus"),
    EditorManager = brackets.getModule("editor/EditorManager"),
    KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
    DocumentManager = brackets.getModule("document/DocumentManager");

  // Function to copy the current line and column number to the clipboard
  function copyCursorPosition() {
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

  // Register the command
  const COPY_CURSOR_POSITION_ID = "copyCursorPosition.copy";
  CommandManager.register(
    "Copy Cursor Position",
    COPY_CURSOR_POSITION_ID,
    copyCursorPosition
  );

  // Add a key binding for the command
  KeyBindingManager.addBinding(COPY_CURSOR_POSITION_ID, "Ctrl-Shift-X");

  // Initialize extension once shell is finished initializing.
  AppInit.appReady(function () {
    console.log("Extension ready: Copy Cursor Position");
  });
});
