const utils = require('./common');

hybridd = {
  mkHybriddCallStream: function (url) {
    var hybriddCallStream = Rx.Observable
      .fromPromise(hybriddcall({r: url, z: true}))
      .filter(R.propEq('error', 0))
      .map(R.merge({r: url, z: true}));

    var hybriddCallResponseStream = hybriddCallStream
      .flatMap(function (properties) {
        return Rx.Observable
          .fromPromise(hybriddReturnProcess(properties));
      });

    return hybriddCallResponseStream;
  }
};

hybriddcall = function (properties) {
  var urltarget = properties.r;
  var usercrypto = GL.usercrypto;
  var step = nextStep();
  var reqmethod = typeof properties.z === 'undefined' && properties.z;
  var urlrequest = path + zchanOrYchanEncryptionStr(reqmethod, usercrypto)(step)(urltarget);

  return fetch(urlrequest)
    .then(r => r.json()
      .then(encodedResult => zchanOrYchanEncryptionObj(reqmethod, usercrypto)(step)(encodedResult)) // TODO: Factor out decoding!!!
      .catch(e => console.log('Error hybriddCall', e)))
    .catch(e => console.log('Error hybriddCall', e));
};

// proc request helper function
hybriddReturnProcess = function (properties) {
  var processStep = nextStep();
  var reqmethod = typeof properties.z === 'undefined' && properties.z;
  var urlrequest = path + zchanOrYchanEncryptionStr(reqmethod, GL.usercrypto)(processStep)('p/' + properties.data);

  return fetch(urlrequest)
    .then(r => r.json()
      .then(r => zchanOrYchanEncryptionObj(reqmethod, GL.usercrypto)(processStep)(r)) // TODO: Factor out decoding!!!
      .catch(e => console.log('Error hybriddCall', e)))
    .catch(e => console.log('Error hybriddCall', e));
};

// FIXME: zchan/ychan - this must be connected to Argu's login model!
function zchanOrYchanEncryptionStr (requestMethod, userCrypto) {
  return function (step) {
    return function (str) {
      var encryptionMethod = requestMethod ? zchan : ychan;
      return encryptionMethod(userCrypto, step, str);
    };
  };
}

function zchanOrYchanEncryptionObj (requestMethod, userCrypto) {
  return function (step) {
    return function (obj) {
      var encryptionMethod = requestMethod ? zchan_obj : ychan_obj;
      return encryptionMethod(userCrypto, step, obj);
    };
  };
}
