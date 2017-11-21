'use strict';

module.exports = {
  entry: './src/main.js',
  output: {
    filename: 'dist/main.js'
  },
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
