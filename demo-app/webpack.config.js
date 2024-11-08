const webpack = require("@nativescript/webpack");
const fs = require("fs");
const emberWebpack = require('ember-native/utils/webpack.config')


module.exports = (env) => {
	webpack.init(env);

	// Learn how to customize:
	// https://docs.nativescript.org/webpack

  emberWebpack(webpack);

	return webpack.resolveConfig();
};
