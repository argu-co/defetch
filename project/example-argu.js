nacl_factory = require('./nacl');

crypto = require('crypto');

var Hybridd = require('./hybridd.interface.nodejs');
var hybridd = new Hybridd.Interface({http: require('http')});

var base = 'waves';
var symbol = 'waves.vote';

openConnection({username:'3MNY6P42EYFPIVHW', password: '6AAOR4FMKF6VB5E2RE4ORUW7XPUUTSO7RNCZ2SOASWO47F6Y',hostname: 'http://wallet-uat.internetofcoins.org/api/'}
               , (data) => { console.log(JSON.stringify(data)); }
               , (error) => { console.error(error); }
               , (progress) => { console.log(progress+'%'); }
              );

// data -> { username:username, password:password, hostname:hostname, successcb:successcb }
function openConnection(data, successcb, errorcb,progresscb) {
  hybridd.sequential([
    'init',
    {username: data.username, password: data.password}, 'session',
    {host: data.hostname}, 'addHost',
    {symbol: 'waves.vote'}, 'addAsset',
  ]
                     , (result) => { successcb(result); }
                     , (error) => { errorcb(error); }
                     ,progresscb
                    );
}

function createTarget(successcb, errorcb) {
  var hybriddTmp = new Hybridd.Interface({http: require('http')});
  hybridd.sequential([
    'init',
    {},'createAccount',
    {host: 'http://wallet-uat.internetofcoins.org:1111'}, 'addHost',
    data => {return {username:data.userid, password:data.passwd}}, 'session'
  ]
                     , (data) => { successcb(data); }
                     , (error) => { errorcb(error); }
                     ,progresscb
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
                     ,progresscb
                    );
}
