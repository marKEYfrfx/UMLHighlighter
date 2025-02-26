const path = require('path');

module.exports = {
  target: 'node',
  entry: './src/vscode_extension.ts',
  output: {
    filename: 'vscode_extension.js',
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, 'dist'),
    devtoolModuleFilenameTemplate: '[resource-path]'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  devtool: 'source-map',
  module: {
    rules: [
      // 1) If you need to load a specific file, e.g. `uml_highlighter.ts`, as raw JS (string):
      {
        test: /uml_highlighter_loader\.ts$/,
        exclude: /node_modules/,
        use: [
          // Remember: the order is right-to-left:
          // `ts-loader` runs first -> produces JS,
          // `raw-loader` runs second -> turns JS into a string.
          {
            loader: 'raw-loader'
          },
          {
            loader: 'ts-loader'
          }
        ]
      },
      // 2) For all other .ts / .tsx files, do a normal TypeScript compile:
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      }
    ]
  }
};