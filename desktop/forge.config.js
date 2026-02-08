module.exports = {
  packagerConfig: {
    name: 'DailyBrief Setup',
    executableName: 'dailybrief-setup',
    icon: './assets/icon', // Will need to create this
    asar: true,
  },
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: 'DailyBrief Setup',
        icon: './assets/icon.icns',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
  ],
};
