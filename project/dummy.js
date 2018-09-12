nacl_factory = require('./nacl');

var Hybridd = require('./hybridd.interface.nodejs');
var hybridd = new Hybridd.Interface({http: require('http')});

hybridd.sequential([
  'init',
  {username: '*****', password: '****'}, 'session',
  {host: 'http://localhost:1111/'}, 'addHost',
  {symbol: 'dummy', amount: 100, channel: 'y'}, 'rawTransaction'

]
  , (data) => { console.log(JSON.stringify(data)); }
  , (error) => { console.error(error); }
  , (progress) => { console.log(progress); }
);
