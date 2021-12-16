/* eslint-disable */
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");

module.exports = (env, argv) => ({
  mode: argv.mode === "production" ? "production" : "development",
  devtool: argv.mode === "production" ? false : "inline-source-map",

  entry: {
    server: "./server/index.ts",
    client: "./client/index.tsx",
  },

  module: {
    rules: [
      { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },
      { test: /\.css$/, loader: [{ loader: "style-loader" }, { loader: "css-loader" }] },
      { test: /\.(png|jpg|gif|webp|svg)$/, loader: [{ loader: "url-loader" }] },
    ],
  },

  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
  },

  output: {
    filename: "[name].js",
    path: `${__dirname}/dist`,
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./client/index.html",
      filename: "client.html",
      inlineSource: ".(js)$",
      chunks: ["client"],
    }),
    new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin),
  ],
});
