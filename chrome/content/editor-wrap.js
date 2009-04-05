const pref_manager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

function Startup() {
  if (pref_manager.getBoolPref("extensions.hocr-edit.side_by_side_layout"))
    document.documentElement.orient = "horizontal";

  var preview = document.getElementById("preview");
  var editor = document.getElementById("editor")

  // disable unwanted features on the document preview frame
  preview.docShell.allowPlugins = false;
  preview.docShell.allowJavascript = false;
  preview.docShell.allowMetaRedirects = false;
  preview.docShell.allowSubframes = false;

  // determine the url of the document
  var spec = document.location + "";
  var url = spec.substring(spec.indexOf(':') + 1);

  preview.onload = function () {
    editor.contentWindow.wrappedJSObject.notification_box = document.getElementById("notification-box");
    editor.contentWindow.wrappedJSObject.preview = preview.contentDocument.wrappedJSObject;
    editor.contentWindow.wrappedJSObject.unwrapped_preview = preview.contentDocument;
    editor.contentWindow.wrappedJSObject.preview_window = preview.contentWindow;
    editor.contentWindow.wrappedJSObject.load_interface();
  };
  preview.contentWindow.location.href = url;
}

function Shutdown() {
}

function WindowIsClosing() {
  return true;
}
