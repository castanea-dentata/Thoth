const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { VueLoaderPlugin } = require('vue-loader');

class AssetJsonPlugin {
    apply(compiler) {
        compiler.hooks.done.tap(
            'AssetJsonPlugin',
            (stats) => {
                const assetData = {
                    version: stats.toJson().chunks[0].hash,
                    files: stats.toJson().assetsByChunkName,
                };

                require('fs').writeFileSync(
                    path.join(__dirname, '/public/dist/', 'assets.json'), JSON.stringify(assetData),
                );
            });
    }
}

module.exports = {
    mode: 'production',
    entry: {
        app: [
            'whatwg-fetch',
            './client/css/lighterpack.scss',
            './client/lighterpack.js',
        ],
        share: [
            './public/js/pies.js',
            './public/js/share.js',
            './client/css/share.scss',
        ],
    },
    output: {
        path: path.resolve(__dirname, './public/dist'),
        publicPath: '/dist/',
        filename: '[name].[chunkhash].js',
    },
    devServer: {
        hot: false,
        static: {
            directory: path.join(__dirname),
        },
        proxy: [
            {
                context: ['/register', '/login', '/api', '/logout'],
                target: 'http://localhost:3000',
            },
        ],
        historyApiFallback: true,
        compress: true,
        port: 8080,
        host: 'local.lighterpack.com', 
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    compilerOptions: {
                        MODE: 3
                    }
                }
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
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            url: {
                                filter: (url) => {
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
    
    devtool: false,
    plugins: [
        new VueLoaderPlugin(),
        new webpack.LoaderOptionsPlugin({
            minimize: true,
        }),
        new MiniCssExtractPlugin({
            filename: '[name].[chunkhash].css',
        }),
        new AssetJsonPlugin(),
    ],
};
