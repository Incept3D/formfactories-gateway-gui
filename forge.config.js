module.exports = {
  packagerConfig: {
    icon: './images/icon',
    osxSign: {},
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    },
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
          homepage: 'https://formfactories.com'
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
