DEBUG = false;
LZString = require('../crypto/lz-string'); // TODO required globally by UrlBase64
var HybriddNode = require('./hybriddNode');
UrlBase64 = require('../crypto/urlbase64'); // TODO make non global as soon as index.js can do require
var Decimal = require('../crypto/decimal-light');

var CommonUtils = require('../index');
var sjcl = require('../crypto/sjcl');
var hexToBase32 = require('../crypto/hex2base32').hexToBase32;
var proof = require('../crypto/proof');

var DJB2 = require('../crypto/hashDJB2');

// create window and/or crypto globals if they do not exist
if (typeof window === 'undefined') {
  window = {};
}
if (typeof crypto === 'undefined') {
  crypto = {};
}
if (typeof FormData === 'undefined') {
  FormData = {};
}

/* NOT NEEDED AS IT IS INCLUDED AT COMPILE TIME
 * fs = require('fs');
 * var naclFactory = require('../crypto/nacl');
 * TODO include sjcl?
 * nacl_factory = require('../crypto/nacl');
 */

/**
 * Internet of Coins main API interface object. It connects to servers running Internet of Coins Hybridd using the REST API.  For reference: [Hybridd API]{@link https://wallet1.internetofcoins.org/api/help}
 * @param {Object} data - one of the three methods below must be passed:
 * @param {Object} data.http - a http object. ({@link https://nodejs.org/api/http.html})
 * @param {Object} data.XMLHttpRequest - a XMLHttpRequest object. ({@link https://developer.mozilla.org/nl/docs/Web/API/XMLHttpRequest})
 * @param {Function} data.custom - a custom connector method which receives a hostname, query, dataCallback and errorCallback parameters and returns a string.
 * @example
 * // Node JS
 * var IoC = require('./ioc.nodejs.client');
 *
 * var ioc = new IoC.Interface({http:require('http')});
 *
 * function onSucces(){
 *  console.error('Done.');
 * }
 *
 * function onError(){
 *   console.error('Oops, something went wrong!');
 * }
 *
 * ioc.init(null, onSucces, onError);
 * @example
 * <!-- Webpage -->
 * <script src="./ioc.web.client.js"></script> to html header
 * <script>
 * var ioc = new IoC.Interface({XMLHttpRequest:XMLHttpRequest});
 *
 * function onSucces(){
 *  console.error('Done.');
 * }
 *
 * function onError(){
 *   console.error('Oops, something went wrong!');
 * }
 *
 * ioc.init(null, onSucces, onError);
 * </script>
 * @example
 * ioc.sequential([
 *   'init', // Initialize ioc
 *   {username: '****************', password: '****************'}, // Define credentials
 *   'login', // Do the login
 *   {host: 'http://localhost:1111/'}, // Define the host
 *   'addHost', // Add and initialize the host
 *   {symbol: 'dummy'}, // Define the asset
 *   'addAsset', // Add and initialize the asset
 *   {symbol: 'dummy', amount: 100}, // Define the transaction
 *   'transaction' // Execute the transaction
 * ],
 *  onSucces,
 *  onError,
 *  onProgress
 * );
 * @constructor
 */

var Interface = function (data) {
  var connector = data;
  var user_keys;
  /*
    boxPk
    boxSk
  */
  var assets = {};
  /* per symbol:
     {$SYMBOL:
     {
     seed
     keys
     address
     }
     }
  */
  var deterministic = {};
  /*  per keygen-base:
      {$KEYGEN-BASE :
      {
      keys()
      sign()
      ..TODO
      }
      }
  */
  var hybriddNodes = {};
  /**
 * Initialize the NACL factory if nacl has not been defined yet.
 * @param {Object} data - Not used
 * @param {Function} dataCallback - Called when the method is succesful.
 * @param {Function} errorCallback - Called when an error occurs.
 */
  this.init = function (data, dataCallback, errorCallback) {
    this.logout(null,
      () => {
        if (typeof nacl === 'undefined') {
          nacl_factory.instantiate(function (naclinstance) {
            nacl = naclinstance; // nacl is a global that is initialized here.
            window.nacl = nacl;
            if (typeof dataCallback === 'function') { dataCallback(); }
          });
        } else {
          if (typeof dataCallback === 'function') { dataCallback(); }
        }
      },
      errorCallback);
  };

  /**
 * Log out of current session.
 * @param {Object} data - Not used
 * @param {Function} dataCallback - Called when the method is succesful.
 * @param {Function} errorCallback - Called when an error occurs.
 */
  this.logout = function (data, dataCallback, errorCallback) {
    assets = {};
    user_keys = undefined;
    if (typeof dataCallback === 'function') { dataCallback(); }
  };

  /**
 * Create a new session and - if required - log out of current session.
 * @param {Object} data
 * @param {string} data.username - The username for the deterministic session
 * @param {string} data.password - The password for the deterministic session
 * @param {Function} dataCallback - Called when the method is succesful.
 * @param {Function} errorCallback - Called when an error occurs.
 */
  this.login = function (data, dataCallback, errorCallback) {
    if (!CommonUtils.validateUserIDLength(data.username)) {
      if (typeof errorCallback === 'function') {
        errorCallback('Invalid username.');
      }
      return;
    }
    if (!CommonUtils.validatePasswordLength(data.password)) {
      if (typeof errorCallback === 'function') {
        errorCallback('Invalid password.');
      }
      return;
    }
    this.logout({}, () => { // first logout clear current data
      user_keys = CommonUtils.generateKeys(data.password, data.username, 0);
      if (typeof dataCallback === 'function') { dataCallback(); }
    });
  };

  /**
 * Initialize an asset (crypto currency or token)
 * @param {Object} data
 * @param {Object} data.assetDetails - Asset details as retrieved by calling `/asset/$SYMBOL/details`
 * @param {string} data.deterministicCodeBlob - A string containing the deterministic code blob.
 * @param {Function} dataCallback - Called when the method is succesful.
 * @param {Function} errorCallback - Called when an error occurs.
 */
  this.initAsset = function (data, dataCallback, errorCallback) {
    if (!deterministic.hasOwnProperty(data.assetDetails['keygen-base'])) { //  blob was not yet initialized
      var code = LZString.decompressFromEncodedURIComponent(data.deterministicCodeBlob);
      try {
        deterministic[data.assetDetails['keygen-base']] = CommonUtils.activate(code);
      } catch (e) {
        if (DEBUG) { console.error(e); }
        if (typeof errorCallback === 'function') {
          errorCallback(e);// TODO prepend error message
        }
        return;
      }
    }
    assets[data.assetDetails.symbol] = data.assetDetails;
    assets[data.assetDetails.symbol].data = {};
    assets[data.assetDetails.symbol].data.seed = CommonUtils.seedGenerator(user_keys, data.assetDetails['keygen-base']);
    try {
      var mode = data.assetDetails.mode.split('.')[1]; // (here submode is named mode confusingly enough)
      assets[data.assetDetails.symbol].data.mode = mode;
      assets[data.assetDetails.symbol].data.keys = deterministic[data.assetDetails['keygen-base']].keys(assets[data.assetDetails.symbol].data);
      assets[data.assetDetails.symbol].data.keys.mode = mode;
      assets[data.assetDetails.symbol].data.address = deterministic[data.assetDetails['keygen-base']].address(assets[data.assetDetails.symbol].data.keys);
    } catch (e) {
      if (DEBUG) { console.error(e); }
      if (typeof errorCallback === 'function') {
        errorCallback(e);// TODO prepend error message
      }
      return;
    }
    if (dataCallback) { dataCallback(data.assetDetails.symbol); }
  };

  /**
 * Add an asset (crypto currency or token) to the session.
 * @param {Object} data
 * @param {string} data.symbol - The symbol of the asset
 * @param {string} [data.channel] - The channel used for the calls. 'y' for encryped, 'z' for encryped and compresses;
 * @param {Function} dataCallback - Called when the method is succesful.
 * @param {Function} errorCallback - Called when an error occurs.
 */
  this.addAsset = function (data, dataCallback, errorCallback) {
    // TODO symbol as array of strings to load multiple?
    if (!assets.hasOwnProperty(data.symbol)) { // if assets has not been iniated, retrieve and initialize
      this.call({host: data.host, query: '/asset/' + data.symbol + '/details', channel: data.channel}, (asset) => {
        var mode = asset.mode.split('.')[0];
        if (deterministic.hasOwnProperty(asset['keygen-base'])) { // Deterministic blob was already retrieved
          this.initAsset({assetDetails: asset, deterministicCodeBlob: deterministic[asset['keygen-base']]}, dataCallback, errorCallback);
        } else {
          this.call({host: data.host, query: '/source/deterministic/code/' + mode, channel: data.channel}, (blob) => {
            this.initAsset({assetDetails: asset, deterministicCodeBlob: blob}, dataCallback, errorCallback);
          }, errorCallback);
        }
      }, errorCallback);
    } else if (typeof dataCallback !== 'undefined') {
      dataCallback(data.symbol);
    }
  };

  /**
 * Perform proof or work.
 * @param {Object} data
 * @param {string} data.hash - TODO
 * @param {string} [data.difficulty] - TODO
 * @param {Function} dataCallback - Called when the method is succesful.
 * @param {Function} errorCallback - Called when an error occurs.
 */
  this.proofOfWork = function (data, dataCallback, errorCallback) {
    proof(data.hash, dataCallback, errorCallback, data.difficulty);
  };

  /**
 * Execute a function in a deterministic blob.
 * @param {Object} data
 * @param {string} [data.symbol] - The asset symbol . Either this or the id needs to be defined.
 * @param {string} [data.id] - id of the deterministic blob. (For assets this is the keygen-base)
 * @param {string} data.func - The deterministic function to be called
 * @param {string} data.data - The data to be passed to the deterministic function
 * @param {Function} dataCallback - Called when the method is succesful.
 * @param {Function} errorCallback - Called when an error occurs.
 */
  this.deterministic = function (data, dataCallback, errorCallback) {
    var id;
    var displayId;
    if (data.hasOwnProperty('id')) {
      id = data.id;
      displayId = id;
    } else if (data.hasOwnProperty('symbol')) {
      if (assets.hasOwnProperty(data.symbol) && typeof dataCallback === 'function') {
        id = assets[data.symbol]['keygen-base'];
        displayId = id + '(' + data.symbol + ')';
      } else {
        if (DEBUG) { console.error('Asset ' + data.symbol + ' not initialized.'); }
        if (typeof errorCallback === 'function') {
          errorCallback('Asset ' + data.symbol + ' not initialized.');
        }
        return;
      }
    } else {
      if (DEBUG) { console.error('Either data.id or data.symbol needs to be defined.'); }
      if (typeof errorCallback === 'function') {
        errorCallback('Either data.id or data.symbol needs to be defined.');
      }
    }

    var execute = () => {
      if (deterministic[id].hasOwnProperty(data.func) && typeof deterministic[id][data.func] === 'function') {
        var result;
        try {
          result = deterministic[id][data.func](data.data, dataCallback, errorCallback);
        } catch (e) {
          if (DEBUG) { console.error(e); }// todo more descriptive error
          if (typeof errorCallback === 'function') {
            errorCallback(e);// todo more descriptive error
          }
          return;
        }
        if (typeof result !== 'undefined') { // when nothing is returned, expect it to be async
          dataCallback(result);
        }
      } else {
        if (DEBUG) { console.error('Deterministic function ' + data.func + ' for ' + displayId + ' not defined or not a function.'); }
        if (typeof errorCallback === 'function') {
          errorCallback('Deterministic function ' + data.func + ' for ' + displayId + ' not defined or not a function.');
        }
      }
    };
    if (deterministic.hasOwnProperty(id)) {
      execute();
    } else { // if blob not yet available, get it.
      this.call({host: data.host, query: '/source/deterministic/code/' + id, channel: data.channel}, (blob) => {
        var code = LZString.decompressFromEncodedURIComponent(blob);
        try {
          deterministic[id] = CommonUtils.activate(code);
        } catch (e) {
          if (DEBUG) { console.error(e); }
          if (typeof errorCallback === 'function') {
            errorCallback(e);// TODO prepend error message
          }
          return;
        }
        execute();
      }, errorCallback);
    }
  };

  /**
 * Get the address associated to a specific asset for current session.
 * @param {Object} data
 * @param {string} data.symbol - The asset symbol.
 * @param {Function} dataCallback - Called when the method is succesful.
 * @param {Function} errorCallback - Called when an error occurs.
 */
  this.getAddress = function (data, dataCallback, errorCallback) {
    if (assets.hasOwnProperty(data.symbol) && typeof dataCallback === 'function') {
      dataCallback(assets[data.symbol].data.address);
    } else {
      if (DEBUG) { console.error('Asset ' + data.symbol + ' not initialized.'); }
      if (typeof errorCallback === 'function') {
        errorCallback('Asset ' + data.symbol + ' not initialized.');
      }
    }
  };

  /**
 * Get the keys associated to a specific asset for current session. Important: handle your private keys confidentially.
 * @param {Object} data
 * @param {string} data.symbol - The asset symbol.
 * @param {Function} dataCallback - Called when the method is succesful.
 * @param {Function} errorCallback - Called when an error occurs.
 */
  this.getKeys = function (data, dataCallback, errorCallback) {
    if (assets.hasOwnProperty(data.symbol) && typeof dataCallback === 'function') {
      dataCallback(assets[data.symbol].data.keys);
    } else {
      if (DEBUG) { console.error('Asset ' + data.symbol + ' not initialized.'); }
      if (typeof errorCallback === 'function') {
        errorCallback('Asset ' + data.symbol + ' not initialized.');
      }
    }
  };

  /**
 * Get the publick key associated to a specific asset for current session.
 * @param {Object} data
 * @param {string} data.symbol - The asset symbol.
 * @param {Function} dataCallback - Called when the method is succesful.
 * @param {Function} errorCallback - Called when an error occurs.
 */
  this.getPublicKey = function (data, dataCallback, errorCallback) {
    if (assets.hasOwnProperty(data.symbol) && typeof dataCallback === 'function') {
      if (assets[data.symbol].data.keys.hasOwnProperty('publicKey')) {
        dataCallback(assets[data.symbol].data.keys.publicKey);
      } else {
        dataCallback(undefined);
      }
    } else if (typeof errorCallback === 'function') {
      errorCallback('Asset ' + data.symbol + ' not initialized.');
    }
  };

  /**
 * Create a signed transaction
 * @param {Object} data
 * @param {string} data.symbol - The symbol of the asset.
 * @param {string} data.target - The target address.
 * @param {Number} data.amount - The amount.
 * @param {Number} data.fee - The fee.
 * @param {Object} data.unspent - Pretransaction data.
 * @param {Function} dataCallback - Called when the method is succesful.
 * @param {Function} errorCallback - Called when an error occurs.
 */
  this.signTransaction = function (data, dataCallback, errorCallback) {
    // TODO check symbol
    // TODO check amount
    // TODO check target
    if (!assets.hasOwnProperty(data.symbol)) {
      if (DEBUG) { console.error('Asset ' + data.symbol + ' not added.'); }
      if (typeof errorCallback === 'function') {
        errorCallback('Asset ' + data.symbol + ' not added.');
      }
      return;
    }
    var asset = assets[data.symbol];
    if (!deterministic.hasOwnProperty(asset['keygen-base'])) {
      if (DEBUG) { console.error('Asset ' + data.symbol + ' not initialized'); }
      if (typeof errorCallback === 'function') {
        errorCallback('Asset ' + data.symbol + ' not initialized.');// TODO error message
      }
      return;
    }

    var toInt = function (input, factor) {
      var f = Number(factor);
      var x = new Decimal(String(input));
      return x.times('1' + (f > 1 ? '0'.repeat(f + 1) : '')).toString();
    };

    var fee;
    try {
      fee = toInt(Number(data.fee || asset.fee), asset.factor);
    } catch (e) {
      if (DEBUG) { console.error(e); }
      if (typeof errorCallback === 'function') {
        errorCallback(e);// TODO error message
      }
      return;
    }
    var amount;
    try {
      amount = toInt(Number(data.amount), asset.factor);
    } catch (e) {
      if (DEBUG) { console.error(e); }
      if (typeof errorCallback === 'function') {
        errorCallback(e);// TODO error message
      }
      return;
    }
    var transactionData = {
      mode: asset.data.keys.mode,
      symbol: asset.symbol,
      source: asset.data.address,
      target: data.target,
      amount: amount,
      fee: fee,
      factor: asset.factor,
      contract: asset.contract,
      keys: asset.data.keys,
      seed: asset.data.seed,
      unspent: data.unspent
    };

    var checkTransaction;
    try {
      checkTransaction = deterministic[asset['keygen-base']].transaction(transactionData, dataCallback);// TODO errorCallback
    } catch (e) {
      if (DEBUG) { console.error(e); }
      if (typeof errorCallback === 'function') {
        errorCallback(e);// TODO prepend error message
      }
      return;
    }
    if (typeof checkTransaction !== 'undefined' && typeof dataCallback === 'function') {
      dataCallback(checkTransaction);
    }
  };

  /**
 * Creates a raw transaction
 * @param {Object} data
 * @param {string} data.symbol - The symbol of the asset
 * @param {string} data.target - The target address
 * @param {Number} data.amount - The amount that should be transferred
 * @param {Number} data.fee - The fee.
 * @param {string} [data.host] - The host that should be used.
 * @param {string} [data.channel] - Indicate the channel 'y' for encryption, 'z' for both encryption and compression
 * @param {Function} dataCallback - Called when the method is succesful. Passes result data.
 * @param {Function} errorCallback - Called when an error occurs. Passes error.
 * @param {Function} progressCallback - Called whenever there is a progress updated. Passes a number between 0 and 1.
 */
  this.rawTransaction = function (data, dataCallback, errorCallback, progressCallback) {
    this.sequential({steps: [
      {symbol: data.symbol}, 'addAsset',
      {symbol: data.symbol}, 'getAddress',
      address => { return {query: '/asset/' + data.symbol + '/unspent/' + address + '/' + data.amount + '/' + data.target + '/public_key', channel: data.channel, host: data.host}; }, 'call',
      unspent => { return {symbol: data.symbol, target: data.target, amount: data.amount, fee: data.fee, unspent: unspent}; }, 'signTransaction'
    ]}, dataCallback, errorCallback, progressCallback);
  };

  /**
 * Create and execute a transaction
 * @param {Object} data
 * @param {string} data.symbol - The symbol of the asset
 * @param {string} data.target - The target address
 * @param {Number} data.amount - The amount that should be transferred
 * @param {Number} data.fee - The fee.
 * @param {string} [data.host] - The host that should be used.
 * @param {string} [data.channel] - Indicate the channel 'y' for encryption, 'z' for both encryption and compression
 * @param {Function} dataCallback - Called when the method is succesful. Passes result data.
 * @param {Function} errorCallback - Called when an error occurs. Passes error.
 * @param {Function} progressCallback - Called whenever there is a progress updated. Passes a number between 0 and 1.
 */
  this.transaction = function (data, dataCallback, errorCallback, progressCallback) {
    this.sequential({steps: [
      data, 'rawTransaction',
      tx => { return { query: '/asset/' + data.symbol + '/push/' + tx, channel: data.channel, host: data.host }; }, 'call'
    ]}, dataCallback, errorCallback, progressCallback);
  };

  /**
 * Add a hybridd node as host.
 * @param {Object} data
 * @param {string} data.host - The hostname TODO  multiple in array?
 * @param {Function} dataCallback - Called when the method is succesful.
 * @param {Function} errorCallback - Called when an error occurs.
 */
  this.addHost = function (data, dataCallback, errorCallback) {
    if (typeof data === 'string') { data = {host: data}; }
    // TODO check if valid hostname
    var hybriddNode = new HybriddNode.HybriddNode(data.host);
    hybriddNodes[data.host] = hybriddNode;
    // TODO only login to node if a session is available
    hybriddNode.init({userKeys: user_keys, connector: connector}, dataCallback, errorCallback);
  };

  /**
 * Make a call to hybridd node
 * @param {Object} data
 * @param {string} data.query - The query path. For reference: [Hybridd API]{@link https://wallet1.internetofcoins.org/api/help}
 * @param {string} [data.channel] - Indicate the channel 'y' for encryption, 'z' for both encryption and compression
 * @param {Boolean} [data.meta] - Indicate whether to include meta data (process information)
 * @param {string} [data.host] - Select a specific host, if omitted one will be chosen at random.
 * @param {Function} dataCallback - Called when the method is succesful.
 * @param {Function} errorCallback - Called when an error occurs.
 */
  this.call = function (data, dataCallback, errorCallback) {
    var host;
    if (typeof data.host === 'undefined') {
      host = Object.keys(hybriddNodes)[0]; // todo select random
    } else {
      host = data.host;
    }

    // TODO add for y,z chan: error when no session (user_keys) have been created
    if (hybriddNodes.hasOwnProperty(host)) {
      switch (data.channel) {
        case 'y' : hybriddNodes[host].yCall({query: data.query, channel: data.channel, userKeys: user_keys, connector: connector}, dataCallback, errorCallback); break;
        case 'z' : hybriddNodes[host].zCall({query: data.query, channel: data.channel, userKeys: user_keys, connector: connector}, dataCallback, errorCallback); break;
        default : hybriddNodes[host].call({query: data.query, connector: connector}, dataCallback, errorCallback); break;
      }
    } else {
      if (DEBUG) { console.error('Host not initialized'); }
      if (typeof errorCallback === 'function') {
        errorCallback('Host not initialized');
      }
    }
  };
  /**
 * TODO   WIP Create a new deterministic account with the entropy provided.
 * @param {Object} data
 * @param {string} [data.entropy] - TODO
 * @param {Function} [data.pool] - TODO
 * @param {Function} dataCallback - Called when the method is succesful.
 * @param {Function} errorCallback - Called when an error occurs.
 */
  this.createAccount = function (data, dataCallback, errorCallback) {
    if (DEBUG) { console.error('Not implemented yet'); }
    if (typeof errorCallback === 'function') {
      errorCallback('Not implemented yet');
    }
    return; // FIXME after pool is fixed properly

    var pool = function (randomNumber) {
    /*  SecureRandom.seedTime();
      SecureRandom.seedInt16(randomNumber);
      var poolHex = SecureRandom.poolCopyOnInit != null
        ? Crypto.util.bytesToHex(SecureRandom.poolCopyOnInit)
        : Crypto.util.bytesToHex(SecureRandom.pool); */
      return 'ABCDEF1234567890'.repeat(100); // FIXME
    };

    var entropy = '';
    var maxIndex = 1000 + Math.floor(Math.random() * 256);

    var numberList = new Array(maxIndex).fill(0).map(() => {
      return Math.floor(Math.random() * Math.pow(8, 16));
    });

    var iterate = index => {
      if (index === maxIndex) {
        if (entropy.length < 411 + 20 + 60) {
          if (DEBUG) { console.error('Entropy is of insufficient length. Required > ' + (411 + 20 + 60)); }
          if (typeof errorCallback === 'function') {
            errorCallback('Entropy is of insufficient length. Required > ' + (411 + 20 + 60));
          }
        } else {
          var offset = Math.floor(Math.random() * 411);
          // 411+20+60
          var passwd = hexToBase32(entropy.substr(offset + 20, 60));
          var userid = hexToBase32(entropy.substr(offset, 12) +
                                   DJB2.hash(entropy.substr(offset, 12).toUpperCase()).substr(0, 4) +
                                   DJB2.hash(entropy.substr(offset, 12).toLowerCase() + passwd.toUpperCase()).substr(4, 4));

          dataCallback({userid, passwd});
        }
      } else {
        entropy = pool(numberList[index]);
        ++index;
        iterate(index);
      }
    };
    iterate(0);
  };

  /**
   * Identity function, outputs the data that is passed
   * @param {Array.<string|Object|Function>} data - data passed to  dataCallback
   * @param {Function} dataCallback - Called with data provided.
   * @param {Function} errorCallback - Ignored
   */
  this.id = (data, dataCallback, errorCallback) => {
    dataCallback(data);
  };

  /**
   * Sequentually executes functions and passes results to next step.
   * @param {Array.<string|Object|Function>} data - Sequential steps to be processed. An object indicates data that is supplied to the next step. A function is a transformation of the data of the previous step and given to the next step. A string is a method that used the data from the last step and supplies to the next step.
   * @param {Function} dataCallback - Called when the method is succesful. Passes result data.
   * @param {Function} errorCallback - Called when an error occurs. Passes error.
   * @param {Function} progressCallback - Called whenever there is a progress updated. Passes a number between 0 and 1.
   */
  this.sequential = (data, dataCallback, errorCallback, progressCallback, currentStep, totalSteps) => {
    if (data.constructor.name === 'Array') {
      data = {steps: data};
    }
    if (typeof currentStep === 'undefined') {
      currentStep = 0;
      totalSteps = data.steps.length;
    }

    if (data.steps.length === 0) {
      if (typeof progressCallback === 'function') {
        progressCallback(1);
      }
      dataCallback(data.data);
    } else {
      if (typeof progressCallback === 'function') {
        progressCallback(currentStep / totalSteps);
      }
      var step = data.steps[0];
      if (typeof step === 'string') {
        if (this.hasOwnProperty(step)) {
          if (DEBUG) { console.log('this.' + step + '(' + JSON.stringify(data.data) + ')'); }

          var subStepProgressCallback;
          if (typeof progressCallback === 'function') {
            subStepProgressCallback = (progress) => {
              progressCallback((currentStep + progress) / totalSteps);
            };
          }

          this[step](data.data, resultData => {
            this.sequential({data: resultData, steps: data.steps.slice(1)}, dataCallback, errorCallback, progressCallback, currentStep + 1, totalSteps);
          }, errorCallback, subStepProgressCallback);
        } else {
          if (DEBUG) { console.error('Method "' + step + '" does not exist for IoC.Interface class.'); }
          if (typeof errorCallback === 'function') {
            errorCallback('Method "' + step + '" does not exist for IoC.Interface class.');
          }
        }
      } else if (typeof step === 'object') {
        if (DEBUG) { console.log(JSON.stringify(data.data) + ' => ' + JSON.stringify(step)); }
        this.sequential({data: step, steps: data.steps.slice(1)}, dataCallback, errorCallback, progressCallback, currentStep + 1, totalSteps);
      } else if (typeof step === 'function') {
        var result = step(data.data);
        if (DEBUG) { console.log(JSON.stringify(data.data) + ' => ' + JSON.stringify(result)); }
        this.sequential({data: result, steps: data.steps.slice(1)}, dataCallback, errorCallback, progressCallback, currentStep + 1, totalSteps);
      }
    }
  };

  /**
   * Parallely executes several steps and collects results in a single object.
   * @param {Object} data - Parallel steps to be processed. TODO
   * @param {Object} data.label - TODO
   * @param {Object} data.label.data - TODO
   * @param {Object} data.label.step - TODO
   * @param {Function} dataCallback - Called when the method is succesful. Passes result data.
   * @param {Function} errorCallback - Called when an error occurs. Passes error.
   * @param {Function} progressCallback - Called whenever there is a progress updated. Passes a number between 0 and 1.
   */
  this.parallel = (data, dataCallback, errorCallback, progressCallback) => {
    var steps = data;
    var stepCount = Object.keys(steps).length;

    var resultMarks = {};
    var resultProgress = {};
    for (var i in steps) {
      resultProgress[i] = 0;
    }
    var parallelProgressCallback;
    if (typeof progressCallback === 'function') {
      parallelProgressCallback = () => {
        var totalProgress = 0;
        for (var i in steps) {
          totalProgress += resultProgress[i];
        }
        progressCallback(totalProgress / stepCount);
      };
    }

    var resultData = {};

    if (stepCount === 0) {
      dataCallback({});
      return;
    }
    var dataSubCallback = i => result => {
      if (resultMarks.hasOwnProperty(i)) { return; }
      resultProgress[i] = 1;
      resultMarks[i] = true;
      resultData[i] = result;
      if (typeof progressCallback === 'function') { parallelProgressCallback(); }
      if (Object.keys(resultMarks).length === stepCount) {
        dataCallback(resultData);
      }
    };

    var errorSubCallback = i => error => {
      if (resultMarks.hasOwnProperty(i)) { return; }
      resultMarks[i] = false;
      resultProgress[i] = 1;
      resultData[i] = undefined; // error;
      if (typeof progressCallback === 'function') { parallelProgressCallback(); }
      if (Object.keys(resultMarks).length === stepCount) {
        /* if (errorCount === resultCount) {
            if (DEBUG) { console.error(error); }
            if (typeof errorCallback === 'function') {
              errorCallback(error);
            }
          } else { */
        dataCallback(resultData);
        // }
      }
    };
    var subProgressCallback;
    if (typeof progressCallback === 'function') {
      subProgressCallback = i => progress => {
        resultProgress[i] = progress;
        parallelProgressCallback();
      };
    }
    var executeStep = (i, step, data) => {
      if (typeof step === 'string') {
        if (this.hasOwnProperty(step)) {
          this[step](data, dataSubCallback(i), errorSubCallback(i), subProgressCallback);
        } else {
          if (DEBUG) { console.error('Method "' + step + '" does not exist for IoC.Interface class.'); }
          if (typeof errorCallback === 'function') {
            errorCallback('Method "' + step + '" does not exist for IoC.Interface class.');
          }
        }
      } else if (typeof step === 'function') {
        step(data, dataSubCallback(i), errorSubCallback(i), subProgressCallback);
      }
    };

    for (var i in steps) {
      var step = steps[i];
      if (typeof step === 'object') {
        if (step.hasOwnProperty('step')) {
          if (step.hasOwnProperty('data')) {
            executeStep(i, step.step, step.data);
          } else {
            executeStep(i, step.step, data);
          }
        } else {
          if (DEBUG) { console.error('No step defined.'); }

          if (typeof errorCallback === 'function') {
            errorCallback('No step defined.');
          }
        }
      } else {
        executeStep(i, step, data);
      }
    }
  };
};

module.exports = {Interface};
