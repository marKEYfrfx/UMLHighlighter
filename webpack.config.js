// webpack.config.js
const path = require('path');

module.exports = {
  mode: 'development',       // or 'production'
  entry: './src/uml_highlighter.ts', // This is your only "entry" file
  output: {
    filename: 'bundle.js',          // The compiled output
    path: path.resolve(__dirname, 'dist'), 
    // In dev-server, the file is served from memory at /bundle.js by default
  },
  module: {
    rules: [
      {
        test: /\.ts$/, 
        loader: 'ts-loader',  // or other TS loader
        exclude: /node_modules/,
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  devServer: {
    // By default, the dev server will serve your bundle at http://localhost:8080/bundle.js
    // If you want to serve a static folder, you can specify it here:
    static: {
       directory: path.join(__dirname, 'public'),
     },
    port: 8080,
  },
};
