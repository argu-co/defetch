nacl_factory = require('../../crypto/nacl.js');

var IoC = require('../ioc.nodejs.client.js');
var ioc = new IoC.Interface({http: require('http')});

ioc.sequential([
  'init',
  {username: 'POMEW4B5XACN3ZCX', password: 'TVZS7LODA5CSGP6U'}, 'login',
  {host: 'http://localhost:1111/'}, 'addHost',
  {symbol: 'eth'}, 'addAsset',
  {symbol: 'eth', data: {dummy: 'dummy'}, func: 'address'}, 'deterministic'

]
  , (data) => { console.log(JSON.stringify(data)); }
  , (error) => { console.error(error); }
);
