function Startup() {
  var preview = document.getElementById("preview");
  var editor = document.getElementById("editor")

  var spec = document.location + "";
  var url = spec.substring(spec.indexOf(':') + 1);

  // ideally, we would have a way to disable the document's own javascript, in cases where it exists
  preview.onload = function () {
    editor.contentWindow.wrappedJSObject.preview = preview.contentDocument.wrappedJSObject;
    editor.contentWindow.wrappedJSObject.load_interface();
  };
  preview.contentWindow.location.href = url;
}

function Shutdown() {
}

function WindowIsClosing() {
  return true;
}
