const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  name: 'mfe-pedidos',

  filename: 'remoteEntry.js',

  exposes: {
    './routes': './projects/mfe-pedidos/src/app/app.routes.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),

    'shared-notifications': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto'
    },
  },

});
