nacl_factory = require('../../crypto/nacl.js');

var IoC = require('../ioc.nodejs.client.js');
var ioc = new IoC.Interface({http: require('http')});

ioc.sequential([
  'init',
  {username: '*****', password: '****'}, 'login',
  {host: 'http://localhost:1111/'}, 'addHost',
  {symbol: 'dummy', amount: 100, channel: 'y'}, 'rawTransaction'

]
  , (data) => { console.log(JSON.stringify(data)); }
  , (error) => { console.error(error); }
  , (progress) => { console.log(progress); }
);
