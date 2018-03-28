var path = require('path');
var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var root = '../javascripts/app'

module.exports = {
    entry: [
        path.resolve(__dirname, './src/main.js')
    ],
    output: {
        path: path.resolve(__dirname, root),
        filename: 'app.js'
    },
    devServer: {
        inline: true,
        contentBase: path.join(__dirname, "./src"),
        compress: true,
        port: 3000
    },
    module: {
        loaders: [
            {
                test: /\.js?$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015', 'react', 'stage-0']
                }
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {}
                    }
                ]
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new CopyWebpackPlugin([
            { from: './src/css/', to: './css' },
            { from: './src/images/', to: './images' },
        ])
    ]
};