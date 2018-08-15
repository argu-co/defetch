var ychan = require('../ychan');
var zchan = require('../zchan');
var UrlBase64 = require('../crypto/urlbase64');
var CommonUtils = require('../index');

var HybriddNode = function (host_) {
  var step; // Incremental step. Steps 0 and 2 used for x-authentication, subsequent steps used for y and z chan
  var nonce; // Random value

  var initial_session_data;
  /* generateInitialSessionData(...) => {
     = {
     session_hexkey,
     session_hexsign,
     session_keypair,
     session_nonce,option
     session_seckey,
     session_secsign,
     session_signpair
     }
  */
  var secondary_session_data;
  /* generateSecondarySessionData(...) => {
     nonce1_hex,
     nonce2_hex,
     crypt_hex
     }
  */

  var ternary_session_data;
  /* sessionStep1Reply(...) => {
     sess_hex,
     current_nonce
     }
  */

  var server_session_data;
  /*  xAuthFinalize xauth response on step 1 =>
      server_sign_pubkey
      server_session_pubkey
      current_nonce
      crhex
  */
  var host = host_;

  this.xAuthStep0Request = function () {
    step = 0; // TODO error if not x ===undefined
    return '/x/' + initial_session_data.session_hexsign + '/0';
  };

  this.xAuthStep1Request = function (nonce1) {
    step = 1; // TODO error if not x === 0
    try {
      secondary_session_data = CommonUtils.generateSecondarySessionData(nonce1, initial_session_data.session_hexkey, initial_session_data.session_signpair.signSk);
    } catch (e) {
      console.log('Error: ' + JSON.stringify(e));
    }
    return '/x/' + initial_session_data.session_hexsign + '/1/' + secondary_session_data.crypt_hex;
  };

  this.xAuthFinalize = function (data, userKeys) {
    server_session_data = data;
    var combined_session_data = {userKeys: userKeys, nonce: nonce};
    Object.assign(combined_session_data, server_session_data, initial_session_data, secondary_session_data);

    ternary_session_data = CommonUtils.sessionStep1Reply(data, combined_session_data, () => {});
  };

  this.yCall = function (data, dataCallback, errorCallback) {
    /* data = {
       query,
       channel: 'y'|'z'
       userKeys
       }
    */

    step++;

    var generalSessionData = ychan.getGeneralSessionData({user_keys: data.userKeys, nonce: ternary_session_data.current_nonce}, step, ternary_session_data.sess_hex);
    /*
      generalSessionData = {
      sessionID,
      clientSessionSecKey,
      serverSessionPubKey,
      sessionNonce
       connector
      };
    */
    //    ternary_session_data.current_nonce[23]++;
    var y = ychan.encode_sub({
      sessionID: generalSessionData.sessionID,
      sessionNonce: generalSessionData.sessionNonce,
      serverSessionPubKey: generalSessionData.serverSessionPubKey,
      clientSessionSecKey: generalSessionData.clientSessionSecKey,
      step: step,
      txtdata: data.query
    });
    this.call({query: data.channel + '/' + y, connector: data.connector, meta: true}, (encdata) => {
      // decode encoded data into text data
      var txtdata = ychan.decode_sub({
        encdata: encdata,
        sessionNonce: generalSessionData.sessionNonce,
        serverSessionPubKey: generalSessionData.serverSessionPubKey,
        clientSessionSecKey: generalSessionData.clientSessionSecKey
      });
      if (data.channel === 'y') {
        try {
          data = JSON.parse(txtdata);
        } catch (error) {
          console.error(error);
          if (typeof errorCallback === 'function') {
            errorCallback(error);
          }
          return;
        }
        dataCallback(data);
      } else {
        dataCallback(txtdata);
      }
    }, errorCallback);
  };

  this.zCall = function (data, dataCallback, errorCallback) {
    /* data = {
       query,
       channel: 'z'
       userKeys
       connector
       }
    */
    var encodedQuery = zchan.encode({user_keys: data.userKeys, nonce: ternary_session_data.current_nonce}, step, data.query);
    this.yCall({query: encodedQuery, channel: 'z', userKeys: data.userKeys, connector: data.connector}, encodedData => {
      var txtdata = zchan.decode_sub(encodedData);
      var data;
      try {
        data = JSON.parse(txtdata);
      } catch (error) {
        console.error(error);
        if (typeof errorCallback === 'function') {
          errorCallback(error);
        }
        return;
      }
      dataCallback(data);
    }, errorCallback);
  };

  this.call = function (data, dataCallback, errorCallback) { // todo options: {connector,interval, timeout}
    /* data = {
       query,
       connector,
       meta
       }
    */
    var meta = !!data.meta; // meta is a boolean indicating whether to strip the meta data from a call
    var xhrSocket = (host, query, dataCallback, errorCallback) => {
      var xhr = new data.connector.XMLHttpRequest();
      xhr.onreadystatechange = e => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            dataCallback(xhr.responseText);
          } else {
            console.error(xhr.responseText);
            if (typeof errorCallback === 'function') {
              errorCallback(xhr.responseText);
            }
          }
        }
      };
      xhr.open('GET', host + query, true);
      xhr.send();
    };

    var httpSocket = (host, query, dataCallback, errorCallback) => {
      data.connector.http.get(host + query, (res) => {
        const { statusCode } = res;
        // const contentType = res.headers['content-type'];

        let error;
        if (statusCode !== 200) {
          error = ('Request error: Status Code: ' + statusCode);
        }
        if (error) {
          console.error(error);
          if (typeof errorCallback === 'function') {
            errorCallback(error); // TODO error.message
          }
          // consume response data to free up memory
          res.resume();
          return;
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          dataCallback(rawData);
        });
      }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);

        if (typeof errorCallback === 'function') {
          errorCallback(`Got error: ${e.message}`);
        }
      });
    };

    var xhrAvailable = true;
    var httpAvailable = true;

    try { XMLHttpRequest; } catch (e) {
      if (e.name === 'ReferenceError') {
        xhrAvailable = false;
      }
    }
    try { http; } catch (e) {
      if (e.name === 'ReferenceError') {
        httpAvailable = false;
      }
    }

    var connector;
    if (data.connector.hasOwnProperty('XMLHttpRequest')) { connector = xhrSocket; }
    if (data.connector.hasOwnProperty('http')) { connector = httpSocket; }
    if (data.connector.hasOwnProperty('custom')) { connector = data.connector.custom; }

    if (typeof connector === 'undefined') {
      console.error('Error: No http request connector method available.');
      if (typeof errorCallback === 'function') {
        errorCallback('Error: No http request connector method available.');
      }
      return;
    }

    connector(host, data.query, (response) => {
      var data;
      try {
        data = JSON.parse(response);
      } catch (error) {
        console.error(error);
        if (typeof errorCallback === 'function') {
          errorCallback(error);
        }
        return;
      }
      if (data.hasOwnProperty('id') && data.id === 'id') {
        var interval = setInterval(() => {
          connector(host, '/proc/' + data.data, (response) => {
            var data;
            try {
              data = JSON.parse(response);
            } catch (error) {
              console.error(error);
              clearInterval(interval);
              if (typeof errorCallback === 'function') {
                errorCallback(error);
              }
              return;
            }
            if (data.hasOwnProperty('error') && data.error !== 0) {
              console.error(data);
              clearInterval(interval);
              if (typeof errorCallback === 'function') {
                errorCallback(data.info);
              }
            } else if (data.stopped !== null) {
              clearInterval(interval);
              dataCallback(meta ? data : data.data);
            }
          });
        }, 500); // TODO parametrize, add timeout

        // TODO errorCallback gebruiken bij timeout?
      } else if (dataCallback) {
        if (data.hasOwnProperty('error') && data.error !== 0) {
          console.error(data);
          if (typeof errorCallback === 'function') {
            errorCallback(response);
          }
          return;
        }
        dataCallback(meta ? data : data.data);
      }
    },
    errorCallback
    );
  };

  this.init = function (data, successCallback, errorCallback) {
    /* data =
       {
       userKeys
       connector
       }
    */
    nonce = nacl.crypto_box_random_nonce();
    initial_session_data = CommonUtils.generateInitialSessionData(nonce);
    this.call({query: this.xAuthStep0Request(), connector: data.connector, meta: true}, (response) => {
      this.call({query: this.xAuthStep1Request(response.nonce1), connector: data.connector, meta: true}, (response) => {
        this.xAuthFinalize(response, data.userKeys);
        if (successCallback) { successCallback(host); }
      }, errorCallback);
    }, errorCallback);
  };
};

module.exports = {HybriddNode};
