const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const exec = require('child_process').exec;
const webpack = require('webpack');

module.exports = merge(common, {
  mode: 'development',
  watch: true,
  watchOptions: {
    ignored: /dist/,
  },
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
          exec('cp ./dist/adapters.js ../../docs/olli/adapters-dev.js', (err, stdout, stderr) => {
            if (stdout) process.stdout.write(stdout);
            if (stderr) process.stderr.write(stderr);
          });
        });
      },
    },
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ],
});
