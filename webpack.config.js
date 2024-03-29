/* eslint-disable */
const HtmlWebpackPlugin = require("html-webpack-plugin")
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin")

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
      { test: /\.css$/, use: [{ loader: "style-loader" }, { loader: "css-loader" }] },
      { test: /\.(png|jpg|gif|webp|svg)$/, type: "asset/resoource" },
    ],
  },

  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    alias: {
      "react": "preact/compat",
      "react-dom/test-utils": "preact/test-utils",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime"
    },
  },

  output: {
    filename: "[name].js",
    path: `${__dirname}/dist`,
  },

  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: "./client/index.html",
      filename: "client.html",
      cache: false,
      excludeChunks: ['server'],
    }),
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/client/]),
  ],
})
