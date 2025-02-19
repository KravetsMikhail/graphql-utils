const webpack = require('webpack');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const config = env => {
	
  process.env.BABEL_ENV = 'production';
  process.env.NODE_ENV = 'production';
 
  return {
	  mode: 'production',
	  target: "async-node",
	  entry: './src/index.js',
	  node: {
		console: false
	  },
	  optimization: {
		minimizer: [
				// This is only used in production mode
				new TerserPlugin({
					terserOptions: {
					parse: {
						// we want terser to parse ecma 8 code. However, we don't want it
						// to apply any minfication steps that turns valid ecma 5 code
						// into invalid ecma 5 code. This is why the 'compress' and 'output'
						// sections only apply transformations that are ecma 5 safe
						// https://github.com/facebook/create-react-app/pull/4234
						ecma: 8,
					},
					compress: {
						ecma: 5,
						warnings: false,
						// Disabled because of an issue with Uglify breaking seemingly valid code:
						// https://github.com/facebook/create-react-app/issues/2376
						// Pending further investigation:
						// https://github.com/mishoo/UglifyJS2/issues/2011
						comparisons: false,
						// Disabled because of an issue with Terser breaking valid code:
						// https://github.com/facebook/create-react-app/issues/5250
						// Pending futher investigation:
						// https://github.com/terser-js/terser/issues/120
						inline: 2,
						drop_console: true,
					},
					output: {
						ecma: 5,
						comments: false,
						// Turned on because emoji and regex is not minified properly using default
						// https://github.com/facebook/create-react-app/issues/2488
						ascii_only: true,
					},
					},
					// Use multi-process parallel running to improve the build speed
					// Default number of concurrent runs: os.cpus().length - 1
					parallel: true,
					// Enable file caching
					cache: true,
					sourceMap: true,
				})
			]
		},
		plugins: [
		],
		output: {
			path: path.resolve(__dirname, 'build'),
			filename: env.NODE_MODULE+'.js'
		}
  }
}

module.exports = config;