import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'lk.royalhires.payroll',
  appName: 'Royal Hires Payroll',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
