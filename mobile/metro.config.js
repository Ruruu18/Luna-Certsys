const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Enable network polyfills for React Native
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Resolve React to a single version to avoid "Invalid hook call" errors
config.resolver.extraNodeModules = {
  'react': path.resolve(__dirname, 'node_modules/react'),
  'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
};

// Add network debugging and better error handling
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Log network requests for debugging
      if (req.url.includes('supabase') || req.url.includes('auth')) {
        console.log('Metro proxy request:', req.method, req.url);
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;