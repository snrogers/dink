module.exports = {
  ignore: [
    '**/*.spec.js',
  ],
  presets: [
    [ '@babel/preset-env', {
      targets: {
        node: '12.14.1' },
    } ],
  ],
  plugins: [
    'source-map-support',
  ],
  retainLines: true,
}
