const {
  shareAll,
  withModuleFederationPlugin
} = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto'
    }),

    'shared-notifications': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto'
    },

    '@angular/cdk': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto'
    },

    'primeng': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto'
    },
  }

});
