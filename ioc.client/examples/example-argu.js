nacl_factory = require('../../crypto/nacl.js');

var IoC = require('../ioc.nodejs.client.js');
var ioc = new IoC.Interface({http: require('http')});

var base = 'waves';
var symbol = 'waves.vote';

openConnection('3MNY6P42EYFPIVHW', '6AAOR4FMKF6VB5E2RE4ORUW7XPUUTSO7RNCZ2SOASWO47F6Y', 'http://wallet-uat.internetofcoins.org/api/',
 () => {} // WIP
);

function openConnection(username, password, hostname, successcb, errorcb) {
  ioc.sequential([
      'init',
      {username: username, password: password}, 'login',
      {host: hostname}, 'addHost',
      {symbol: 'waves.vote'}, 'addAsset',
    ]
    , (data) => { successcb(data); }
    , (error) => { errorcb(error); }
  );
}

function createTarget(successcb, errorcb) {
  var ioctmp = new IoC.Interface({http: require('http')});
  ioc.sequential([
    'init',
    {},'createAccount'
    {host: 'http://wallet-uat.internetofcoins.org/api/'}, 'addHost',
    data => {return {username:data.userid, password:data.passwd}}, 'login',
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
  ioc.sequential([
      {symbol: symbol, amount: Number(amount), target: target }, 'rawTransaction'
  ]
    , (data) => { successcb(data); }
    , (error) => { errorcb(error); }
  );
}
