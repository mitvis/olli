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
        filename: 'olli.js',
        path: path.resolve('../../', 'dist/olli'),
        library: {
            type: 'umd',
            // name: 'Olli',
        },
        globalObject: 'this',
    }
}