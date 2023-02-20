module.exports = {
  packagerConfig: {},
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
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Marko Ritachka',
          homepage: 'https://formfactories.com'
        }
      }
    }
    // {
    //   name: '@electron-forge/maker-dmg',
    //   config: {
    //     background: './assets/dmg-background.png',
    //     format: 'ULFO'
    //   }
    // },
    // {
    //   name: '@electron-forge/maker-snap',
    //   config: {
    //     features: {
    //       audio: true,
    //       mpris: 'com.example.mpris',
    //       webgl: true
    //     },
    //     summary: 'formfactories gateway'
    //   }
    // }
  ],
};
