nacl_factory = require('./nacl');

crypto = require('crypto');

var Hybridd = require('./hybridd.interface.nodejs');
var hybridd = new Hybridd.Interface({http: require('http')});

var base = 'waves';
var symbol = 'waves.vote';


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

function createTarget(data, successcb, errorcb, progresscb) {
  hybridd.sequential([
    {},'createAccount',
  ]
                     , (data) => { successcb(data); }
                     , (error) => { errorcb(error); }
                     ,progresscb
                    );
}

function sendVote(data, successcb, errorcb,progresscb) {
  var amount = 1;
  var symbol = 'waves.vote';
  hybridd.sequential([
    {symbol: symbol, amount: Number(amount), target: data }, 'rawTransaction'
  ]
                     , (data) => { successcb(data); }
                     , (error) => { errorcb(error); }
                     ,progresscb
                    );
}


hybridd.sequential([
  {func:openConnection,data:{username:'3MNY6P42EYFPIVHW', password: '6AAOR4FMKF6VB5E2RE4ORUW7XPUUTSO7RNCZ2SOASWO47F6Y',hostname: 'http://wallet-uat.internetofcoins.org/api/'}},'callback',
  {func:createTarget}, 'callback',
  x => {console.log(x); return x;},
  {func:sendVote,data:'3PHU3ibHUL311nfe3NR49MymBYX8iXffJEa'},'callback'
]
  , (data) => { console.log(JSON.stringify(data)); }
               , (error) => { console.error(error); }
               , (progress) => { console.log(progress+'%'); }
                  );
