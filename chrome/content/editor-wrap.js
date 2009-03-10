function Startup() {
  var preview = document.getElementById("preview");
  var editor = document.getElementById("editor")

  var spec = document.location + "";
  var url = spec.substring(spec.indexOf(':') + 1);

  preview.setAttribute("src", url);
  editor.contentWindow.preview = preview.contentDocument;
}

function Shutdown() {
}

function WindowIsClosing() {
  return true;
}
