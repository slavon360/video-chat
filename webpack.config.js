const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const PROD = process.env.NODE_ENV === 'production';

module.exports = {
	mode: PROD ? 'production' : 'development',
	entry: './client/js/script.js',
	devtool: 'source-map',
	output: {
		path: `${__dirname}/public/dist`,
		filename: PROD ? '[name].[contenthash].min.js' : '[name].[contenthash].js',
		clean: true
	},
	optimization: {
		runtimeChunk: 'single',
		splitChunks: {
			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					chunks: 'all'
				},
			}
		},
		minimize: PROD,
		minimizer: [
			new TerserPlugin({ parallel: true })
		]
	},
	module: {
		rules: [
			{
				test: /\.s[ac]ss$/i, 
				use: [
					// Creates `style` nodes from JS strings
					PROD ? MiniCssExtractPlugin.loader : 'style-loader',
					// Translates CSS into CommonJS
					'css-loader',
					// Compiles Sass to CSS
					'sass-loader'
				]
			}
		]
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: 'views/room.html',
			filename: `${__dirname}/public/room.html`
		}),
		new MiniCssExtractPlugin({
			// Options similar to the same options in webpackOptions.output
			// both options are optional
			filename: "[name].css",
			chunkFilename: "[id].css",
		})
	]
};