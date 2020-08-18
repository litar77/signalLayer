// NOTE: To use this example standalone (e.g. outside of deck.gl repo)
// delete the local development overrides at the bottom of this file
const path = require('path');
// const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/app.js',
  mode: 'development',
  output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'app.js'
  },
  devServer: {
      contentBase: './dist'
  },
  // plugins: [
  //     new CopyPlugin([
  //         { from: './3DTilesRendererJS/example/customMaterial.html', to: './' },
  //     ]),
  // ],
};

const CONFIG = {
  mode: 'development',

  entry: {
    app: './app.js'
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

  plugins: [new HtmlWebpackPlugin({title: 'spaceojo'})]
};

// This line enables bundling against src in this repo rather than installed module
module.exports = env => (env ? require('./webpack.config.local')(CONFIG)(env) : CONFIG);
