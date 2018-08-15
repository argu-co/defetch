nacl_factory = require('../../crypto/nacl.js');

var IoC = require('../ioc.nodejs.client.js');
var ioc = new IoC.Interface({http: require('http')});

ioc.sequential([
  'init',
  {username: 'POMEW4B5XACN3ZCX', password: 'TVZS7LODA5CSGP6U'}, 'login',
  {host: 'http://localhost:1111/'}, 'addHost',
  {
    dummy: testAsset('dummy')
  }, 'parallel'
]
  , (data) => { console.log(JSON.stringify(data)); }
  , (error) => { console.error(error); }
);

function testAsset (symbol) {
  var testAmount = 0.0001;

  return { data: [
    {symbol: symbol}, 'addAsset',
    {
      sample: {data: {query: '/asset/' + symbol + '/sample'}, step: 'call'},
      details: {data: {query: '/asset/' + symbol + '/details'}, step: 'call'},
      status: {data: {query: '/asset/' + symbol + '/status'}, step: 'call'},
      address: {data: {symbol: symbol}, step: 'getAddress'}
    },
    'parallel',
    (result) => {
      return {
        sample: {data: result.sample, step: 'id'},
        status: {data: result.status, step: 'id'},
        details: {data: result.details, step: 'id'},
        address: {data: result.address, step: 'id'},

        sampleValid: {data: {query: '/source/wavalidator/' + symbol + '/' + result.sample.address}, step: 'call'},
        sampleBalance: {data: {query: '/asset/' + symbol + '/balance/' + result.sample.address}, step: 'call'},
        sampleUnspent: {data: {query: '/asset/' + symbol + '/unspent/' + result.sample.address + '/' + (Number(testAmount) + Number(result.details.fee)) + '/' + result.address + '/' + result.sample.publicKey }, step: 'call'}, // TODO add public key
        sampleHistory: {data: {query: '/asset/' + symbol + '/history/' + result.sample.address}, step: 'call'},
        sampleTransaction: {data: {query: '/asset/' + symbol + '/transaction/' + result.sample.transaction}, step: 'call'},

        seedValid: {data: {query: '/source/wavalidator/' + symbol + '/' + result.address}, step: 'call'},
        seedBalance: {data: {query: '/asset/' + symbol + '/balance/' + result.address}, step: 'call'},
        seedUnspent: {data: {query: '/asset/' + symbol + '/unspent/' + result.address + '/' + (Number(testAmount) + Number(result.details.fee)) + '/' + result.sample.address }, step: 'call'}, //   TODO add public key
        seedHistory: {data: {query: '/asset/' + symbol + '/history/' + result.address}, step: 'call'}

      };
    },
    'parallel',
    (result) => {
      return {
        sample: {data: result.sample, step: 'id'},
        status: {data: result.status, step: 'id'},
        details: {data: result.details, step: 'id'},
        sampleValid: {data: result.sampleValid + ' ' + result.sample.address, step: 'id'},
        sampleBalance: {data: result.sampleBalance, step: 'id'},
        sampleUnspent: {data: result.sampleUnspent, step: 'id'},
        sampleHistory: {data: result.sampleHistory, step: 'id'},
        sampleTransaction: {data: result.sampleTransaction, step: 'id'},
        //        sampleSign: {data: {symbol: symbol, target: result.address, unspent: result.sampleUnspent, amount: testAmount, fee: result.details.fee}, step: 'signTransaction'},

        seedValid: {data: result.seedValid + ' ' + result.address, step: 'id'},
        seedBalance: {data: result.seedBalance, step: 'id'},
        seedUnspent: {data: result.seedUnspent, step: 'id'},
        seedHistory: {data: result.seedHistory, step: 'id'},
        seedSign: {data: {symbol: symbol, target: result.sample.address, unspent: result.seedUnspent, amount: testAmount, fee: result.details.fee}, step: 'signTransaction'}

      };
    },
    'parallel'
  ],
  step: 'sequential'
  };
}
