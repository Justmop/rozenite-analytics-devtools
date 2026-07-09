export default {
  panels: [
    {
      name: 'Analytics Logger',
      source: './src/analytics-logger.tsx',
    },
  ],
  dev: {
    presets: [
      {
        label: 'Sample analytics event',
        type: 'analytics-event',
        payload: {
          eventName: 'screen_view',
          source: 'firebase',
          params: {
            screen_name: 'Home',
            user_id: '123',
          },
          timestamp: Date.now(),
        },
      },
    ],
  },
};
