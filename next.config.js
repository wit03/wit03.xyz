const withPrefresh = require('@prefresh/next');
const optimizedImages = require('next-optimized-images');
const withPlugins = require('next-compose-plugins')
const path = require('path')

const config = {
  experimental: {
    modern: true,
    polyfillsOptimization: true
  },

  webpack(config, { dev, isServer }) {
    const splitChunks = config.optimization && config.optimization.splitChunks
    if (splitChunks) {
      const cacheGroups = splitChunks.cacheGroups;
      const preactModules = /[\\/]node_modules[\\/](preact|preact-render-to-string|preact-context-provider)[\\/]/;
      if (cacheGroups.framework) {
        cacheGroups.preact = Object.assign({}, cacheGroups.framework, {
          test: preactModules
        });
        cacheGroups.commons.name = 'framework';
      }
      else {
        cacheGroups.preact = {
          name: 'commons',
          chunks: 'all',
          test: preactModules
        };
      }
    }
    config.resolve.alias['components'] = path.join(__dirname, 'src/components');
    config.resolve.alias['store'] = path.join(__dirname, '/src/store');
    config.resolve.alias['public'] = path.join(__dirname, './public');
    // Install webpack aliases:
    const aliases = config.resolve.alias || (config.resolve.alias = {});
    aliases.react = aliases['react-dom'] = 'preact/compat';

    // inject Preact DevTools
    if (dev && !isServer) {
      const entry = config.entry;
      config.entry = () => entry().then(entries => {
        entries['main.js'] = ['preact/debug'].concat(entries['main.js'] || []);
        return entries;
      });
    }

    return config;
  }
};

module.exports = withPlugins([
  [optimizedImages, {
    handleImages: ['jpeg', 'png', 'webp'],
    optimizeImages: true,
    optimizeImagesInDev: true
  }]],
  withPrefresh(config));
