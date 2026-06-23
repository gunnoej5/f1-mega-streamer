const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    { name: '@electron-forge/maker-squirrel', config: {} },
    { name: '@electron-forge/maker-zip', platforms: ['darwin'] },
    { name: '@electron-forge/maker-deb', config: {} },
    { name: '@electron-forge/maker-rpm', config: {} },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: {
          entry: './src/main.js',
          resolve: {
            modules: [
              path.resolve(__dirname, 'node_modules'),
              'node_modules',
            ],
          },
        },
        renderer: {
          config: {
            module: {
              rules: [
                {
                  test: /\.(js|jsx)$/,
                  exclude: /node_modules/,
                  use: {
                    loader: 'babel-loader',
                    options: {
                      presets: ['@babel/preset-react'],
                    },
                  },
                },
                {
                  test: /\.css$/,
                  use: ['style-loader', 'css-loader'],
                },
              ],
            },
            resolve: {
              extensions: ['.js', '.jsx', '.json'],
              modules: [
                path.resolve(__dirname, 'node_modules'),
                'node_modules',
              ],
            },
          },
          entryPoints: [
            {
              html: './src/renderer/index.html',
              js: './src/renderer/index.js',
              name: 'main_window',
              preload: {
                js: './src/preload.js',
              },
            },
          ],
        },
      },
    },
  ],
};
