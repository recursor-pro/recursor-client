import type IForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const assets = ["assets"]; // asset directories

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: "webpack-infrastructure",
  }),
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, "src", "index.html"),
    filename: "index.html",
  }),
  ...assets.map((asset) => {
    return new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, "src", asset), to: asset }],
    });
  }),
];
