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
                    'vue-style-loader', // or MiniCssExtractPlugin.loader for production
                    {
                        loader: 'css-loader',
                        options: {
                        url: {
                            filter: (url) => {
                                // Don't resolve absolute URLs starting with /
                                if (url.startsWith('/')) return false;
                                return true;
                            },
                        },
                    },
                },
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
        liveReload: true,
        devMiddleware: {
            writeToDisk: true,
        },
        static: {
            directory: path.join(__dirname, 'public'),
        },
        port: 8080,
        client: {
            overlay: {
                errors: true,
                warnings: false,
                runtimeErrors: (error) => {
                    if (error.message === 'ResizeObserver loop completed with undelivered notifications.') {
                        return false;
                    }
                    return true;
                },
            },
        },
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
