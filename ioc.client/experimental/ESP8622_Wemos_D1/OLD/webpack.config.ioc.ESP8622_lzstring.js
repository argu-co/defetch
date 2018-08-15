// import nodeExternals from 'webpack-node-externals';

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');

module.exports = {
  target: 'node',
  //  externals: [nodeExternals()],
  entry: '../../crypto/lz-string.js',
  output: {
    path: path.resolve(__dirname, '.'),
    filename: './ioc.ESP8622_A.client.js',
    library: 'LZString'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/ /*,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }*/
      }
    ]
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
