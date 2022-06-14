const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const PROD = process.env.NODE_ENV === 'production';

module.exports = {
	mode: PROD ? 'production' : 'development',
	entry: './public/js/script.js',
	devtool: 'source-map',
	output: {
		path: `${__dirname}/public/dist`,
		filename: PROD ? 'bundle.min.js' : 'bundle.js'
	},
	optimization: {
		minimize: PROD,
		minimizer: [
			new TerserPlugin({ parallel: true })
		]
	}
};