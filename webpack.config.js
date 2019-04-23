const path = require('path')
const webpack = require('webpack')

function resolve (dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: {
    'xeats-sdk': './index'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '/dist',
    libraryTarget: 'umd',
    library: 'Xeats'
  },
  resolve: {
    extensions: ['.js', '.vue', '.json', '.css'],
    alias: {
      // 'vue$': 'vue/dist/vue.esm.js',
      '@': resolve('src')
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            'scss': 'vue-style-loader!css-loader!sass-loader'
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src')]
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              attrs: {
                id: 'xeats-sdk-styles',
                prefix: 'xeats-sdk'
              }
            }
          },
          {
            loader: 'css-loader'
          }
        ]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)(\?.*)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 1000000 /* 小於 10kB 的圖片轉成 base64 */,
              name: 'fonts/[name]-[hash].[ext]'
            }
          }
        ]
      }
    ]
  }
}