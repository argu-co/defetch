// import nodeExternals from 'webpack-node-externals';

const path = require('path');

module.exports = {
  target: 'node',
  //  externals: [nodeExternals()],
  entry: './interface.js',
  output: {
    path: path.resolve(__dirname, '.'),
    filename: 'ioc.nodejs.client.js',
    library: 'IoC',
    libraryTarget: 'commonjs2'
  }
};
