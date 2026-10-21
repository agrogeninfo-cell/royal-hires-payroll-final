import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'lk.royalhires.payroll',
  appName: 'Pay Royal',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
