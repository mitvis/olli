const path = require('path');

module.exports = {
<<<<<<< HEAD:webpack.config.js
    // mode: 'production',
=======
    entry: './src/index.ts',
>>>>>>> main:packages/adapters/webpack.config.js
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
        filename: 'adapters.js',
        path: path.resolve('../../', 'dist/olli')
    }
};
