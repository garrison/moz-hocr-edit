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

  function load_interface() {
    editor.contentWindow.wrappedJSObject.notification_box = document.getElementById("notification-box");
    editor.contentWindow.wrappedJSObject.preview = preview.contentDocument.wrappedJSObject;
    editor.contentWindow.wrappedJSObject.unwrapped_preview = preview.contentDocument;
    editor.contentWindow.wrappedJSObject.preview_window = preview.contentWindow;
    if (!editor.contentWindow.wrappedJSObject.document_url)
      editor.contentWindow.wrappedJSObject.document_url = preview.contentDocument.baseURI;
    editor.contentWindow.wrappedJSObject.load_interface();
  }

  preview.onload = function () {
    if (preview.contentDocument.contentType.substring(0, 6) == "image/") {
      preview.onload = function () {
	var div = preview.contentDocument.createElement('div');
	div.setAttribute('class', 'ocr_page');
	div.setAttribute('title', 'image ' + url.substr(url.lastIndexOf('/') + 1));
	// fixme: bbox info from size of image
	preview.contentDocument.body.appendChild(div);
	editor.contentWindow.wrappedJSObject.document_url = url + ".html";
	editor.contentWindow.wrappedJSObject.document_url_exists = false;
	load_interface();
      };
      preview.contentWindow.location.href = "about:blank";
    } else {
      load_interface();
    }
  };

  preview.contentWindow.location.href = url;
}

function Shutdown() {
}

function WindowIsClosing() {
  return true;
}
