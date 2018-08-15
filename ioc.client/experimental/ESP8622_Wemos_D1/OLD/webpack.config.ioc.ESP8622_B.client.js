// import nodeExternals from 'webpack-node-externals';

const path = require('path');

module.exports = {
  entry: './interface_ESP8622_B.js',
  output: {
    path: path.resolve(__dirname, '.'),
    filename: 'ioc.ESP8622_B.client.js',
    library: 'IoC'
  }
};
