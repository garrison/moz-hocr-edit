var preview = null;

// Evaluate an XPath expression aExpression against a given DOM node
// or Document object (aNode), returning the results as an array
// thanks wanderingstan at morethanwarm dot mail dot com for the
// initial work.
//
// This function is based on code at
// https://developer.mozilla.org/en/Using_XPath
function evaluateXPath(aNode, aExpr) {
  var xpe = new XPathEvaluator();
  var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?
    aNode.documentElement : aNode.ownerDocument.documentElement);
  var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
  var found = [];
  var res;
  while (res = result.iterateNext())
    found.push(res);
  return found;
}

function strip(str) {
  str = str.replace(/^\s+/g, "");
  return str.replace(/\s+$/g, "");
}

function is_xhtml() {
  return (preview.contentType == "application/xhtml+xml");
}

function relative_url(url, base) {
  var ios = Components.classes["@mozilla.org/network/io-service;1"]
    .getService(Components.interfaces.nsIIOService);
  var baseURI = ios.newURI(base, null, null);
  return ios.newURI(url + "", null, baseURI).spec; // fixme: we may need a character encoding here
}

function extract_data(node) {
  var retval = {};

  var a = node.title.split(';');
  for (var i in a) {
    var d = strip(a[i]);
    var first_space = d.indexOf(" "); // fixme: this may not exist
    retval[d.substring(0, first_space)] = d.substring(first_space + 1);
  }

  return retval;
}

function create_change_func(line, input_element, same_word_element, whitespace_suffix) {
  if (!whitespace_suffix)
    whitespace_suffix = "\n";
  return function () {
    line.innerHTML = input_element.val() + (same_word_element[0].checked ? "" : whitespace_suffix);
  };
}

function load_interface() {
  // figure out page and set image
  var pages = evaluateXPath(preview, "//*[@class='ocr_page']");
  var page = pages[0];
  var data = extract_data(page);
  var full_image_url = relative_url(data.image, preview.baseURI);
  document.getElementById("full_image").setAttribute("src", full_image_url);
  var cropped_image_span = $('<span style="display: block; background-repeat: no-repeat;"></span>');
  cropped_image_span.css("background-image", "url(" + full_image_url + ")");

  // figure out lines
  var lines = evaluateXPath(page, "//*[@class='ocr_line']");
  for (var i in lines) {
    var line = lines[i];
    var bbox = extract_data(line).bbox.split(" ", 4);
    var whitespace_suffix = line.innerHTML.match(/(\s)+$/);
    if (whitespace_suffix)
      whitespace_suffix = whitespace_suffix[0];
    // fixme: what about text at the end of the span node? (or whitespace prefix in the next element)
    var new_same_word = $('<input type="checkbox"/>');
    new_same_word[0].checked = !whitespace_suffix;
    var new_input = $('<input size="60"/>');
    new_input.val(strip(line.innerHTML));
    var change_func = create_change_func(line, new_input, new_same_word, whitespace_suffix)
    new_same_word.change(change_func);
    new_input[0].onchange = new_input[0].onkeyup = new_input[0].onkeypress = new_input[0].ondrop = change_func;
    var new_img_span = $(cropped_image_span).clone();
    new_img_span.width(bbox[2] - bbox[0]);
    new_img_span.height(bbox[3] - bbox[1]);
    new_img_span.css("background-position", "-" + bbox[0] + "px -" + bbox[1] + "px");
    var new_li = $("<li/>");
    new_li.append(new_img_span);
    new_li.append("<br/>");
    new_li.append(new_input);
    new_li.append(new_same_word);
    $("#lines").append(new_li);
  }
}

function save() {
  var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
  file.initWithPath("/tmp/hocr-edit.html");
  save_file(file);
}

function save_as() {
  const nsIFilePicker = Components.interfaces.nsIFilePicker;
  var file_chooser = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  file_chooser.init(window, "Saving hOCR document", nsIFilePicker.modeSave);
  file_chooser.appendFilters(nsIFilePicker.filterHTML);
  file_chooser.appendFilters(nsIFilePicker.filterAll);
  file_chooser.defaultString = "output" + (is_xhtml() ? ".xhtml" : ".html");
  var status = file_chooser.show();
  if (status != nsIFilePicker.returnCancel) {
    save_file(file_chooser.file);
  }
}

function save_file(file) {
  var output_stream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
  output_stream.init(file, -1, -1, null);
  var serializer = new XMLSerializer(); // (public version of nsIDOMSerializer)
  serializer.serializeToStream(preview, output_stream, "US-ASCII");
  output_stream.write("\n", 1); // trailing newline
  output_stream.flush();
  output_stream.close();
}
