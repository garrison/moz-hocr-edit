function show_popup(clicked_element, event) {
  if (event.button == 0)
    document.getElementById("hocr-edit-overlay-menu").showPopup(clicked_element, -1, -1, "popup", "topright", "bottomright");
}
