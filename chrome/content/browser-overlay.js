function show_hocr_popup(clicked_element, event) {
  if (event.button == 0)
    document.getElementById("hocr-edit-overlay-menu").showPopup(clicked_element, -1, -1, "popup", "topright", "bottomright");
}

function open_hocr_editor_with_current_document() {
  var browser = top.document.getElementById("content");
  var url = 'hocr-edit:' + window.content.document.baseURI;
  browser.loadOneTab(url, null, null, null, false, false);
}

function open_hocr_editor_with_current_image() {
  open_hocr_editor_with_current_document();
}

function is_hocr_document(doc) {
  // determine if there's an element with class "ocr_page"
  var xpe = new XPathEvaluator();
  var resolver = xpe.createNSResolver(doc);
  var result = xpe.evaluate("//*[contains(@class,'ocr_page')]", doc, resolver, 0, null);
  return !!result.iterateNext();
}

function is_hocr_image(doc) {
  return (doc.contentType.substring(0, 6) == "image/");
}

function hocr_onload() {
  function browser_onfocus() {
    var doc = getBrowser().contentWindow.document;
    var edit_current_document = document.getElementById("hocr-edit-open-current-document");
    edit_current_document.disabled = !is_hocr_document(doc);
    var edit_current_image = document.getElementById("hocr-edit-open-current-image");
    edit_current_image.disabled = !is_hocr_image(doc);
  }

  getBrowser().addEventListener('focus', browser_onfocus, true);
}

window.addEventListener('load', hocr_onload, false);
