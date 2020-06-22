const nodeExternals = require('webpack-node-externals')
const path = require('path')

module.exports = {
  mode: 'none',
  entry: './src/index.js',
  externals: [ nodeExternals() ],
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: __dirname,
        exclude: /node_modules/,
      },
    ],
  },
  target: 'node',
}
