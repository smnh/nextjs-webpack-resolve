const path = require('path');

module.exports = {
  reactStrictMode: true,
  webpack: (config, { webpack, isServer }) => {
    config.resolve.plugins.push(
        new CustomResolverPlugin({
          isServer: isServer
        })
    );
    return config;
  }
}

class CustomResolverPlugin {
  constructor({ isServer }) {
    console.log(`[CustomResolverPlugin] init, isServer: ${isServer}`);
    this.isServer = isServer;
  }

  apply(resolver) {
    resolver.getHook('resolve').tapAsync('CustomResolverPlugin', (request, stack, callback) => {
      if (!request._originalRequestPath) {
        request._originalRequestPath = request.request;
      }
      return callback();
    });

    // This is where the magic really happens
    resolver.getHook('before-resolved').tapAsync('CustomResolverPlugin', (request, stack, callback) => {
      const requestPath = request.path;
      const originalPath = request._originalRequestPath;
      const issuer = request.context?.issuer;

      // only consider paths inside the components dir
      if (!requestPath.endsWith('/node_modules/example-lib/child.js')) {
        return callback();
      }

      const newPath = path.join(__dirname, 'src/custom-child.js');
      console.log(`[CustomResolverPlugin]\n  isServer: ${this.isServer}\n  resolve: ${requestPath}\n  with: ${newPath}\n  issuer: ${issuer}\n  required path: ${originalPath}`);
      return resolver.doResolve(
          resolver.hooks.describedRelative,
          { ...request, path: newPath },
          null,
          stack,
          callback
      );
    });
  }
}
