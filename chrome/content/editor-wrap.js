function Startup() {
  var preview = document.getElementById("preview");
  var editor = document.getElementById("editor")

  var spec = document.location + "";
  var url = spec.substring(spec.indexOf(':') + 1);

  // ideally, we would have a way to disable the document's own javascript, in cases where it exists
  preview.setAttribute("src", url);
  // fixme: wait for both frames to finish loading somehow (or at least the preview frame)
  alert("delay of game");
  editor.contentWindow.wrappedJSObject.preview = preview.contentDocument.wrappedJSObject;
  editor.contentWindow.wrappedJSObject.load_interface();
}

function Shutdown() {
}

function WindowIsClosing() {
  return true;
}
