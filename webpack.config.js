const path = require('path');

module.exports = {
    // mode: 'production',
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
    entry: {
        './Olli/olli': './src/index.ts',
        './Olli/Adapters/ObservableAdapter': './src/Adapters/ObservablePlotAdapter.ts',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
};