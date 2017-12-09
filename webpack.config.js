'use strict';

var path = require("path");
var CommonsChunkPlugin = require("./node_modules/webpack/lib/optimize/CommonsChunkPlugin.js");

module.exports = {
  entry: {
  	'main': './app/main.js',
  	'HomeViewModel': './app/components/HomeViewModel.js',
  	'TestBlocksModel': './app/components/TestBlocksModel.js'
  },
  output: {
	path: path.join(__dirname, "dist"),
	filename: "[name].bundle.js",
  },
  plugins: [
	new CommonsChunkPlugin({
		filename: "commons.js",
		name: "commons"
	})
  ],
  module: {
	  rules: [
	    {
	      test: /\.js$/,
	      exclude: /(node_modules|bower_components)/,
	      use: {
	        loader: 'babel-loader',
	        options: {
	          presets: ['es2015']
	        }
	      }
	    }
	  ]
  }
};
