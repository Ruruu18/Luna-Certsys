const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable network polyfills for React Native
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

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