const path = require('path');

module.exports = {
    entry: './src/index.ts',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'adapters.js',
        path: path.resolve('./', 'dist'),
        library: {
            type: 'umd',
            name: 'OlliAdapters',
        },
        globalObject: 'this',
    }
};
