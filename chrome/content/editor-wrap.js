function Startup() {
  var preview = document.getElementById("preview");
  var editor = document.getElementById("editor")

  var spec = document.location + "";
  var url = spec.substring(spec.indexOf(':') + 1);

  preview.setAttribute("src", url);
  // fixme: wait for both frames to finish loading somehow (or at least the preview frame)
  alert("delay of game");
  editor.contentWindow.wrappedJSObject.preview = preview.contentDocument.wrappedJSObject;
}

function Shutdown() {
}

function WindowIsClosing() {
  return true;
}
