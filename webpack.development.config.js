const path = require('path');
const webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
    mode: 'development',
    entry: {
        app: [
            'whatwg-fetch',
            './client/css/lighterpack.scss',
            './client/lighterpack.js',
        ],
        share: [
            './client/css/share.scss',
        ],
    },
    output: {
        path: path.resolve(__dirname, './public/dist'),
        publicPath: '/dist/',
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]?[hash]',
                },
            },
            {
                test: /\.scss$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            implementation: require('sass'),
                        },
                    },
                ],
            },
        ],
    },
    resolve: {},
    devServer: {
        historyApiFallback: true,
        hot: false,
        devMiddleware: {
            writeToDisk: true,
        },
        static: {
            directory: path.join(__dirname, 'public'),
        },
        port: 8080,
        proxy: [
        {
            context: (pathname) => {
                return !pathname.startsWith('/dist/');
            },
            target: 'http://localhost:3000',
            secure: false,
            changeOrigin: true,
        },
    ],
},
    performance: {
        hints: false,
    },
    plugins: [
        new VueLoaderPlugin(),
    ],
};
