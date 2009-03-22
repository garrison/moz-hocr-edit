// these variables are set by editor-wrap.js
var unwrapped_preview = null;
var preview = null;
var preview_window = null;
var notification_box = null;

const ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
const pref_manager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

// i18n
var bundle;
function _(str) { return bundle.getString(str); }

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

function get_elements_by_class(node, class_name) {
  var elements = evaluateXPath(node, "//*[contains(@class,'" + class_name + "')]");
  var retval = [];
  for (var i in elements) {
    var cls = " " + elements[i].getAttribute("class") + " ";
    if (cls.indexOf(" " + class_name + " ") != -1)
      retval.push(elements[i]);
  }
  return retval;
}

function lstrip(str) { return str.replace(/^\s+/g, ""); }
function rstrip(str) { return str.replace(/\s+$/g, ""); }
function strip(str) { return lstrip(rstrip(str)); }

function is_xhtml() {
  // Returns true if the document was parsed with the XML parser, false
  // if parsed with the tag soup parser.  See details at
  // https://developer.mozilla.org/en/Mozilla_Web_Developer_FAQ
  return (preview.contentType == "application/xhtml+xml");
}

function relative_url(url, base) {
  var baseURI = ios.newURI(base, null, null);
  return baseURI.resolve(url);
}

function extract_hocr_data(node) {
  var retval = {};

  var a = node.title.split(';');
  for (var i in a) {
    var d = strip(a[i]);
    var first_space = d.indexOf(" ");
    if (first_space != -1)
      retval[d.substring(0, first_space)] = lstrip(d.substring(first_space));
    else
      retval[d] = null;
  }

  return retval;
}

var highlighted_element = null;
var highlighted_element_original_style = null;

function highlight(element) {
  if (highlighted_element != element) {
    unhighlight();
    highlighted_element = element;
    highlighted_element_original_style = element.hasAttribute("style") ? $(element).attr("style") : null;
    $(element).css("background-color", "#ffa");
  }
}

function unhighlight() {
  if (!highlighted_element)
    return;
  if (highlighted_element_original_style === null)
    highlighted_element.removeAttribute("style"); // seems to work w/o removeAttributeNS
  else
    $(highlighted_element).attr("style", highlighted_element_original_style);
  highlighted_element = null;
}

function create_change_func(line, input_element, same_word_element, whitespace_suffix) {
  if (!whitespace_suffix)
    whitespace_suffix = "\n";
  return function () {
    var text = input_element.val();
    if (same_word_element && !same_word_element[0].checked)
      text += whitespace_suffix;
    if (!is_xhtml()) {
      line.innerHTML = text;
    } else {
      // This may not be valid XML; we need to parse it to find out.
      // We wrap it in a container element for parsing which contains
      // the namespace information.
      var parser = new preview_window.DOMParser();
      var container = parser.parseFromString('<span xmlns="http://www.w3.org/1999/xhtml">' + text + '</span>', 'application/xhtml+xml').documentElement;
      // Unfortunately, the parser does not throw exception if it fails,
      // but instead returns a document with a parsererror element
      // (see mozilla bug #45566)
      if (container.localName != 'parsererror') {
        // well-formed
        line.innerHTML = '';
        for (var i = 0; i < container.childNodes.length; ++i)
          line.appendChild(unwrapped_preview.importNode(container.childNodes[i], true));
      } else {
        // parse error
      }
    }
  };
}

function go_to_line(i) {
  location.hash = "line" + i;
  var input_element = $("#line" + i + " input:text");
  setTimeout(function () { input_element.focus(); }, 0);
}

function load_interface() {
  bundle = document.getElementById("editor-bundle");

  // figure out page
  var pages = get_elements_by_class(preview, "ocr_page");
  if (pages.length == 0) {
    $("#document").append("<p>This does not appear to be an OCR document.</p>");
    return;
  }
  load_page_interface(pages[0]);
}

function load_page_interface(page) {
  // figure out image
  var data = extract_hocr_data(page);
  var full_image_url = relative_url(data.image, preview.baseURI);
  var full_image = $('<div style="position: relative;"><img/></div>')
  full_image[0].firstChild.setAttribute("src", full_image_url);
  var cropped_image_span = $('<span style="display: block; background-repeat: no-repeat;"></span>');
  cropped_image_span.css("background-image", "url(" + full_image_url + ")");

  // figure out lines
  var lines = get_elements_by_class(page, "ocr_line");
  var lines_ul = $("<ul></ul>");
  $("#document").append(lines_ul);
  for (var i in lines) {
    var line = lines[i];
    var bbox = extract_hocr_data(line).bbox.split(/\s+/, 4);
    var bbox_width = bbox[2] - bbox[0];
    var bbox_height = bbox[3] - bbox[1];
    var whitespace_suffix = line.innerHTML.match(/(\s)+$/);
    if (whitespace_suffix)
      whitespace_suffix = whitespace_suffix[0];
    // fixme: what about text at the end of the span node? (or whitespace prefix in the next element)

    // create UI control
    var new_same_word = $('<input type="checkbox"/>');
    new_same_word[0].checked = !whitespace_suffix;
    var new_input = $('<input size="60"/>');
    new_input.val(strip(line.innerHTML));
    var change_func = create_change_func(line, new_input, new_same_word, whitespace_suffix);
    new_same_word.change(change_func);
    new_same_word[0].onblur = unhighlight;
    new_input[0].onkeyup = change_func;
    new_input[0].onkeypress = change_func;
    new_input[0].ondrop = change_func;
    new_input[0].onchange = change_func;
    new_input[0].onblur = unhighlight;
    function create_onfocus_func(line) { return function () { highlight(line); }; }
    new_input[0].onfocus = new_same_word[0].onfocus = create_onfocus_func(line);
    var new_img_span = $(cropped_image_span).clone();
    new_img_span.width(bbox_width);
    new_img_span.height(bbox_height);
    new_img_span.css("background-position", "-" + bbox[0] + "px -" + bbox[1] + "px");
    var new_li = $('<li id="line' + i + '"></li>');
    new_li.append(new_img_span);
    new_li.append("<br/>");
    new_li.append(new_input);
    new_li.append(new_same_word);
    lines_ul.append(new_li);

    // create overlay over full_image
    var overlay_span = $('<a style="position: absolute; display: block; z-index: 1;" href="javascript:go_to_line(' + i + ');"></a>');
    overlay_span.css("left", bbox[0] + 'px');
    overlay_span.css("top", bbox[1] + 'px');
    overlay_span.width(bbox_width);
    overlay_span.height(bbox_height);
    overlay_span[0].onmouseover = create_onfocus_func(line);
    overlay_span[0].onmouseout = unhighlight;
    full_image.append(overlay_span);
  }

  // selection handling
  function handle_preview_selection() {
    var sel = preview_window.getSelection()
    if (!sel.isCollapsed) {
      for (var i in lines) {
	if (sel.containsNode(lines[i], true)) {
	  go_to_line(i);
	  break;
	}
      }
    }
  }
  if (lines.length > 0)
    preview_window.addEventListener('mouseup', handle_preview_selection, false);

  // fall back to textarea
  if (lines.length == 0) {
    var textarea = $('<textarea rows="30" cols="120"/>');
    textarea.val(page.innerHTML);
    var textarea_change_func = create_change_func(page, textarea, null, null);
    textarea[0].onkeyup = textarea_change_func;
    textarea[0].onkeypress = textarea_change_func;
    textarea[0].ondrop = textarea_change_func;
    textarea[0].onchange = textarea_change_func;
    $("#document").append(textarea);
  }

  // show full image
  $("#document").append(full_image);
}

function save_notification_wrapper(save_func) {
  return function () {
    try {
      save_func();
      notification_box.appendNotification(_("savedSuccessfully"), "save-success", null, notification_box.PRIORITY_INFO_LOW, null);
    } catch (e) {
      notification_box.appendNotification(e + "", "save-failure", null, notification_box.PRIORITY_WARNING_MEDIUM, null);
    }
  };
}

function save() {
  var url = ios.newURI(preview.baseURI, null, null);
  if (url.schemeIs("file")) {
    var file_url = url.QueryInterface(Components.interfaces.nsIFileURL);
    var file = file_url.file.QueryInterface(Components.interfaces.nsILocalFile);
    save_file(file);
  } else if (url.schemeIs("http") || url.schemeIs("https")) {
    save_to_http(url);
  }
}

save = save_notification_wrapper(save);

function save_as() {
  const nsIFilePicker = Components.interfaces.nsIFilePicker;
  var file_chooser = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
  file_chooser.init(window, _("savingDocument"), nsIFilePicker.modeSave);
  file_chooser.appendFilters(nsIFilePicker.filterHTML);
  file_chooser.appendFilters(nsIFilePicker.filterAll);
  file_chooser.defaultString = "output" + (is_xhtml() ? ".xhtml" : ".html");
  var status = file_chooser.show();
  if (status != nsIFilePicker.returnCancel) {
    save_notification_wrapper(function () {
      save_file(file_chooser.file);
    })();
  }
}

function save_file(file) {
  var output_stream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
  output_stream.init(file, -1, -1, null);
  serialize_current_document(output_stream);
}

function save_to_http(url) { // or https, of course
  xhr = new XMLHttpRequest();
  xhr.open("PUT", url.spec, false);
  xhr.setRequestHeader("Content-type", (is_xhtml() ? "application/xhtml+xml" : "text/html"));
  function serialized_cb(buffer) {
    xhr.send(buffer);
    if (xhr.status < 200 || xhr.status >= 300)
      throw "Save failed: HTTP status code " + xhr.status;
  }
  serialize_current_document(stream_to_memory(serialized_cb));
}

function serialize_current_document(output_stream) {
  unhighlight();
  if (!is_xhtml() && !pref_manager.getBoolPref("extensions.hocr-edit.disable_tagsoup_output_filter"))
    output_stream = tag_soup_output_filter(output_stream);
  var serializer = new XMLSerializer(); // (public version of nsIDOMSerializer)
  serializer.serializeToStream(preview, output_stream, "US-ASCII");
  output_stream.write("\n", 1); // trailing newline
  output_stream.flush();
  output_stream.close();
}

function tag_soup_output_filter(output_stream) {
  // The tag soup parser converts the name of each HTML element to uppercase
  // (e.g. <BODY>, <P>).  We use a regular expression to convert the
  // the tag names to lowercase in the serialized output.
  function serialized_cb(output_buffer) {
    function to_lower(match) { return match.toLowerCase(); }
    output_buffer = output_buffer.replace(/(\<\/?[A-Z]*)/g, to_lower);
    output_stream.write(output_buffer, output_buffer.length);
    output_stream.flush();
    output_stream.close();
  }
  return stream_to_memory(serialized_cb);
}

function stream_to_memory(close_cb_function) {
  var output_buffer = "";
  var still_open = true;
  var stream = {
    write: function (data, length) {
      if (data.length != length)
        throw "Data length mismatch";
      output_buffer = output_buffer + data;
      return length;
    },
    flush: function () {},
    close: function () {
      if (!still_open)
        throw "Can't close twice";
      still_open = false;
      close_cb_function(output_buffer);
    }
  };
  return stream;
}
