function show_popup(clicked_element, event) {
  if (event.button == 0)
    document.getElementById("hocr-edit-overlay-menu").showPopup(clicked_element, -1, -1, "popup", "topright", "bottomright");
}

function open_hocr_editor_with_current_document() {
  var browser = top.document.getElementById("content");
  var url = 'hocr-edit:' + window.content.document.baseURI;
  browser.loadOneTab(url, null, null, null, false, false);
}
