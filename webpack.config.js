/* eslint-disable */
var webpack = require('webpack'),
  path = require('path'),
  fileSystem = require('fs'),
  env = require('./utils/env'),
  CleanWebpackPlugin = require('clean-webpack-plugin'),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  WriteFilePlugin = require('write-file-webpack-plugin'),
  StringPlugin = require('string-replace-loader'),
  { version, description } = require('./package.json');
const { VueLoaderPlugin } = require('vue-loader');
const { preprocess } = require('./svelte.config');
const mode = process.env.NODE_ENV || 'development';
process.env.NODE_ENV = mode;

// load the secrets
var alias = {
  'jquery.ui': 'jquery-ui-bundle'
};

var secretsPath = path.join(__dirname, ('secrets.' + env.NODE_ENV + '.js'));

var fileExtensions = ['jpg', 'jpeg', 'png', 'gif', 'eot', 'otf', 'svg', 'ttf', 'woff', 'woff2'];

if (fileSystem.existsSync(secretsPath)) {
  alias['secrets'] = secretsPath;
}

const prod = mode !== 'development';
var options = {
  entry: {
    popout: path.join(__dirname, 'src', 'js', 'pages', 'popout.js'),
    options: path.join(__dirname, 'src', 'js', 'pages', 'options.js'),
    background: path.join(__dirname, 'src', 'js', 'pages', 'background.js'),
    watch: path.join(__dirname, 'src', 'js', 'pages', 'watch.js'),
    welcome: path.join(__dirname, 'src', 'js', 'pages', 'welcome.js'),
    hyperchat: path.join(__dirname, 'src', 'js', 'pages', 'hyperchat.js'),
    translatormode: path.join(__dirname, 'src', 'js', 'pages', 'translatormode.js'),
    injector: path.join(__dirname, 'src', 'js', 'content_scripts', 'injector.js'),
    interceptor: path.join(__dirname, 'src', 'js', 'content_scripts', 'interceptor.js'),
    fullscreen: path.join(__dirname, 'src', 'js', 'content_scripts', 'fullscreen.js'),
    chat: path.join(__dirname, 'src', 'submodules', 'chat', 'scripts', 'chat.js'),
  },
  chromeExtensionBoilerplate: {
    notHotReload: []
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /src\/submodules\/chat\/scripts\/chat\.js$/,
        loader: 'string-replace-loader',
        options: {
          search: "import { getWAR } from '@/modules/war.js';",
          replace: 'window.isLiveTL = true; const getWAR = path => chrome.runtime.getURL(path);',
        }
      },
      {
        include: [
          path.resolve(__dirname, "node_modules/jquery-ui-touch-punch")
        ],
        test: /\.js$/,
        loader: 'string-replace-loader',
        options: {
          search: "(jQuery)",
          replace: '(window.jQuery)',
        }
      },
      // {
      //   test: /.*/,
      //   loader: 'cache-loader',
      //   include: /.*/
      // },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
        // include: /.*/
        // exclude: /node_modules/
      },
      {
        test: new RegExp('\.(' + fileExtensions.join('|') + ')$'),
        loader: 'file-loader?name=[name].[ext]',
        // include: /.*/
        // exclude: /node_modules/
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /node_modules/
      },
      {
        test: /\.svelte$/,
        use: {
          loader: prod ? 'svelte-loader' : 'svelte-loader-hot',
          options: {
            dev: !prod,
            emitCss: false,
            hotReload: !prod,
            preprocess
          }
        }
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.s(c|a)ss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            // Requires sass-loader@^7.0.0
            options: {
              implementation: require('sass'),
              indentedSyntax: true // optional
            },
            // Requires >= sass-loader@^8.0.0
            options: {
              implementation: require('sass'),
              sassOptions: {
                indentedSyntax: true // optional
              },
            },
          },
        ],
      },
    ]
  },
  resolve: {
    alias: alias
  },
  plugins: [
    // clean the build folder
    new CleanWebpackPlugin(['build']),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV)
    }),
    new CopyWebpackPlugin([{
      from: 'src/submodules/chat/assets',
      to: 'hyperchat'
    }]),
    new CopyWebpackPlugin([{
      from: 'src/manifest.json',
      transform: function (content, path) {
        // generates the manifest file using the package.json informations
        return Buffer.from(JSON.stringify({
          description: description,
          version: version,
          ...JSON.parse(content.toString())
        }));
      }
    }]),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'empty.html'),
      filename: 'watch.html',
      chunks: ['watch']
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'empty.html'),
      filename: 'popout.html',
      chunks: ['popout']
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'empty.html'),
      filename: 'options.html',
      chunks: ['options']
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'empty.html'),
      filename: 'welcome.html',
      chunks: ['welcome']
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'empty.html'),
      filename: 'background.html',
      chunks: ['background']
    }),
    new WriteFilePlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'empty.html'),
      filename: 'hyperchat/index.html',
      chunks: ['hyperchat']
    }),
    new CopyWebpackPlugin([{
      from: 'src/changelogs/img',
      to: 'img'
    }]),
  ],
  mode,
  devServer: {
    host: "http://localhost:3000/",
    disableHostCheck: true
  }
};

if (env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-eval-source-map';
}

module.exports = options;
