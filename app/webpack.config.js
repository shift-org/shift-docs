var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './client.js',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'client.bundle.js'
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['env', 'react']
                }
            }
        ]
    },
    stats: {
        colors: true
    },
    devtool: 'source-map'
};
