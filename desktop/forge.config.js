module.exports = {
  packagerConfig: {
    name: 'DailyBrief Setup',
    executableName: 'dailybrief-setup',
    asar: true,
    // Don't include any permission descriptions - we don't need them
    // This prevents macOS from asking for Bluetooth, Camera, etc.
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
  ],
};
