nacl_factory = require('../../crypto/nacl.js');

var IoC = require('../ioc.nodejs.client.js');
var ioc = new IoC.Interface({http: require('http')});

// TEMPORARY (REPLACE BY CMDLINE ARGS)
var base = 'eth';
var symbol = 'eth';
var amount = 1;

ioc.sequential([
    'init',
    {username: '3MNY6P42EYFPIVHW', password: '6AAOR4FMKF6VB5E2RE4ORUW7XPUUTSO7RNCZ2SOASWO47F6Y'}, 'login',
    {host: 'http://localhost:1111/'}, 'addHost',
    {symbol: symbol}, 'addAsset',
    {
      details: {data: {query: '/asset/' + symbol + '/details'}, step: 'call'},
      address: {data: {symbol: symbol}, step: 'getAddress'}
    }, 'parallel',
    (result) => {
      console.log("\n"+'Details: '+JSON.stringify(result.details)+"\n");
      console.log('Source address: '+result.address+"\n");
      return {
        details: {data: result.details, step: 'id'},
        address: {data: result.address, step: 'id'},
        unspent: {data: {query: '/asset/' + symbol + '/unspent/' + result.address + '/' + (Number(amount) + Number(result.details.fee)) + '/' + result.address }, step: 'call'} //   TODO add public key
      }
    }, 'parallel',
    (result) => {
      return {
        tx: {data: {symbol: symbol, target: result.address, unspent: result.unspent, amount: Number(amount), fee: result.details.fee}, step: 'signTransaction'}
      }
    }, 'parallel',
  ]
  , (data) => { console.log('Signed transaction: '+JSON.stringify(data.tx)+"\n"); }
  , (error) => { console.error(error); }
);
