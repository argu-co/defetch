nacl_factory = require('../../crypto/nacl.js');

var Hybridd = require('./hybridd.interface.nodejs');
var hybridd = new Hybridd.Interface({http: require('http')});

var base = 'waves';
var symbol = 'waves.vote';

openConnection('3MNY6P42EYFPIVHW', '6AAOR4FMKF6VB5E2RE4ORUW7XPUUTSO7RNCZ2SOASWO47F6Y', 'http://wallet-uat.internetofcoins.org/api/',
 () => {} // WIP
);

// data -> { username:username, password:password, hostname:hostname, successcb:successcb }
function openConnection(data, successcb, errorcb) {
  hybridd.sequential([
      'init',
      {username: data.username, password: data.password}, 'session',
      {host: data.hostname}, 'addHost',
      {symbol: 'waves.vote'}, 'addAsset',
    ]
    , (result) => { successcb(result); }
    , (error) => { errorcb(error); }
  );
}

function createTarget(successcb, errorcb) {
  var hybriddTmp = new Hybridd.Interface({http: require('http')});
  hybridd.sequential([
    'init',
    {},'createAccount',
    {host: 'http://wallet-uat.internetofcoins.org/api/'}, 'addHost',
    data => {return {username:data.userid, password:data.passwd}}, 'session',
    (result) => {
      return {  address: {data: result.address, step: 'id'} };
    }
  ]
    , (data) => { successcb(data); }
    , (error) => { errorcb(error); }
  );
}

function sendVote(target, successcb, errorcb) {
  var amount = 1;
  var symbol = 'waves.vote';
  hybridd.sequential([
      {symbol: symbol, amount: Number(amount), target: target }, 'rawTransaction'
  ]
    , (data) => { successcb(data); }
    , (error) => { errorcb(error); }
  );
}
