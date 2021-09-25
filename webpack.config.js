// NOTE: To use this example standalone (e.g. outside of deck.gl repo)
// delete the local development overrides at the bottom of this file
// const path = require('path');
const {resolve} = require('path');
const webpack = require('webpack');
// const CopyPlugin = require('copy-webpack-plugin');
// const HtmlWebpackPlugin = require('html-webpack-plugin');

const CONFIG = {
  mode: 'development',

  entry: {
    app: './app.js'
  },

  resolve: {
    alias: {
      // From mapbox-gl-js README. Required for non-browserify bundlers (e.g. webpack):
      'mapbox-gl$': resolve('./node_modules/mapbox-gl/dist/mapbox-gl.js')
    }
  },

  module: {
    rules: [
      {
        test: /\.(bin|json)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',// 打包后的文件名称
              outputPath: 'mapdata/', // 默认是dist目录
              publicPath: './', // 数据目录
              useRelativePath: true, // 使用相对路径
              // limit: 50000 // 表示小于1K的图片会被转化成base64格式
            }
          }
        ]
      },
    ]
  },

  // plugins: [new HtmlWebpackPlugin({title: 'spaceojo'})]
   // Optional: Enables reading mapbox token from environment variable
   plugins: [new webpack.EnvironmentPlugin({'MapboxAccessToken':'pk.eyJ1IjoibGl0YXIiLCJhIjoiY2thZ2h2ZWNvMDQwcjJzbHN2ZWF5cG53cyJ9.JccA8XgHr0953SgMLpiUtg'})]
};

// This line enables bundling against src in this repo rather than installed module
module.exports = env => (env ? require('./webpack.config.local')(CONFIG)(env) : CONFIG);
