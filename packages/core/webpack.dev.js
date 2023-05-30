const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const exec = require('child_process').exec;

module.exports = merge(common, {
  mode: 'development',
  watch: true,
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
          exec('cp ./dist/olli.js ../../docs/olli/olli-dev.js', (err, stdout, stderr) => {
            if (stdout) process.stdout.write(stdout);
            if (stderr) process.stderr.write(stderr);
          });
        });
      },
    },
  ],
});
