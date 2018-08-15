// quick wifi connection
// require("Wifi").connect("InternetOfCoins", {password:"zaq12wsxcde3"});

// Flash storage includes
eval(require('Storage').read('lz-string')); // TODO required globally by UrlBase64

// Espruino includes
var http = require("http");

// Variables
var nodes=[ 'http://wallet1.internetofcoins.org' ]

// common utilities
var zchan_encode = function(txtdata) {
  return LZString.compressToEncodedURIComponent(txtdata);
};

var zchan_decode = function(encdata) {
  return LZString.decompressFromEncodedURIComponent(encdata);
};

http.get("http://wallet1.internetofcoins.org", function(res) {
  res.on('data', function(data) {
    console.log(data);
  });
});
