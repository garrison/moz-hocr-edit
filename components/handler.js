// see http://mxr.mozilla.org/mozilla/source/netwerk/protocol/viewsource/src/nsViewSourceHandler.cpp for the ideal way to do this

const HOCR_EDIT = "hocr-edit";

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function EditHOCRProtocolHandler() {
  this.wrappedJSObject = this;
}

EditHOCRProtocolHandler.prototype = {
  classDescription: "hocr-edit protocol handler",
  classID: Components.ID("{66124ee4-0939-11de-9057-00e04cf8693a}"),
  contractID: "@mozilla.org/network/protocol;1?name=" + HOCR_EDIT,
  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIProtocolHandler]),

  scheme: HOCR_EDIT,
  defaultPort: -1,
  protocolFlags: Components.interfaces.nsIProtocolHandler.URI_IS_LOCAL_FILE | Components.interfaces.nsIProtocolHandler.URI_NON_PERSISTABLE | Components.interfaces.nsIProtocolHandler.URI_NORELATIVE,
  // fixme: the descriptions of protocolFlags are cryptic.  see
  // https://developer.mozilla.org/en/NsIProtocolHandler

  allowPort: function (port, scheme) {
    return false;
  },

  newURI: function(spec, charset, baseURI) {
    var uri = Components.classes["@mozilla.org/network/simple-uri;1"].
		createInstance(Components.interfaces.nsIURI);
    uri.spec = spec;
    return uri;
  },

  newChannel: function (uri) {
    var ios = Components.classes["@mozilla.org/network/io-service;1"].
		getService(Components.interfaces.nsIIOService);

    // make sure it is an acceptable uri scheme
    var colon_index = uri.asciiSpec.indexOf(":");
    if (colon_index < 0) {
      throw Components.results.NS_ERROR_MALFORMED_URI;
    }
    var inner_uri = uri.asciiSpec.substring(colon_index + 1);
    if (inner_uri.indexOf("file:") != 0 &&
        inner_uri.indexOf("http:") != 0 &&
        inner_uri.indexOf("https:") != 0)
      throw "hocr-edit only works with file, http, and https URIs at this time.";

    // fire up the editor
    var new_uri = ios.newURI("chrome://hocr-edit/content/editor-wrap.xul", null, null);
    var channel = ios.newChannelFromURI(new_uri);
    channel.originalURI = uri;
    return channel;
  }
};

function NSGetModule(compMgr, fileSpec) {
  return XPCOMUtils.generateModule([EditHOCRProtocolHandler]);
}
