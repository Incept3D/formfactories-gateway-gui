module.exports = {
  packagerConfig: {
    icon: './build/icon',
    osxSign: {},
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        homepage: 'http://formfactories.com'
      },
    },
    // {
    //   name: '@electron-forge/maker-snap',
    //   config: {
    //     features: {
    //       audio: true,
    //       mpris: 'com.formfactories.gateway-gui',
    //       webgl: true
    //     },
    //     summary: 'Connect network devices to your formfactories account'
    //   },
    // },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Marko Ritachka',
          homepage: 'https://formfactories.com',
          productDescription: 'formfactories gateway connects local devices on your network to your formfactories account, allowing you to monitor them, send commands, and manage print queues',
          version: '1.0.10'
        }
      }
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'Vivalize',
          name: 'formfactories-gateway-gui',
        },
        prerelease: false,
        draft: true,
      },
    },
  ],
};
