module.exports = {
  packagerConfig: {
    name: 'DailyBrief Setup',
    executableName: 'dailybrief-setup',
    asar: true,
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
  ],
};
