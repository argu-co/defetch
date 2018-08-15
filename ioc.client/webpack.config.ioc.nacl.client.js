const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');

module.exports = {
  entry: '../crypto/nacl.js',
  output: {
    path: path.resolve(__dirname, '.'),
    filename: './ioc.nacl.client.js.tmp'
  },
  plugins: [
    new UglifyJSPlugin({
      uglifyOptions: {
        compress: true,
        mangle: false,
        output: {
          beautify: false
        }
      }
    })
  ]
};
