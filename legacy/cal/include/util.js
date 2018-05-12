function GetCursorPos(win, textfield) {
  try {
    if (typeof textfield.selectionEnd != "undefined")) {
      // Mozilla directly supports this
      return textfield.selectionEnd;

    } else if (win.document.selection && win.document.selection.createRange) {
      // IE doesn't export an accessor for the endpoints of a selection.
      // Instead, it uses the TextRange object, which has an extremely obtuse
      // API. Here's what seems to work:

      // (1) Obtain a textfield from the current selection (cursor)
      var tr = win.document.selection.createRange();

      // Check if the current selection is in the textfield
      if (tr.parentElement() != textfield) {
        return -1;
      }

      // (2) Make a text range encompassing the textfield
      var tr2 = tr.duplicate();
      tr2.moveToElementText(textfield);

      // (3) Move the end of the copy to the beginning of the selection
      tr2.setEndPoint("EndToStart", tr);

      // (4) The span of the textrange copy is equivalent to the cursor pos
      var cursor = tr2.text.length;

      // Finally, perform a sanity check to make sure the cursor is in the
      // textfield. IE sometimes screws this up when the window is activated
      if (cursor > textfield.value.length) {
        return -1;
      }
      return cursor;
    } else {
      Debug("Unable to get cursor position for: " + navigator.userAgent);

      // Just return the size of the textfield
      // TODO: Investigate how to get cursor pos in Safari!
      return textfield.value.length;
    }
  } catch (e) {
    DumpException(e, "Cannot get cursor pos");
  }
  
  return -1;
}

function SetCursorPos(win, textfield, pos) {
  if (typeof textfield.selectionEnd != "undefined" &&
      typeof textfield.selectionStart != "undefined") {
    // Mozilla directly supports this
    textfield.selectionStart = pos;
    textfield.selectionEnd = pos;

  } else if (win.document.selection && textfield.createTextRange) {
    // IE has textranges. A textfield's textrange encompasses the
    // entire textfield's text by default
    var sel = textfield.createTextRange();

    sel.collapse(true);
    sel.move("character", pos);
    sel.select();
  }
}
