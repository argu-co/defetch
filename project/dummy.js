nacl_factory = require('./nacl');

var Hybridd = require('./hybridd.interface.nodejs');
var hybridd = new Hybridd.Interface({http: require('http')});

hybridd.sequential([
  'init',
  {username:'3MNY6P42EYFPIVHW', password: '6AAOR4FMKF6VB5E2RE4ORUW7XPUUTSO7RNCZ2SOASWO47F6Y'}, 'session',
  {host: 'http://localhost:1111/'}, 'addHost',
  {symbol: 'dummy', amount: 100}, 'rawTransaction'

]
  , (data) => { console.log(JSON.stringify(data)); }
  , (error) => { console.error(error); }
  , (progress) => { console.log(progress); }
);
