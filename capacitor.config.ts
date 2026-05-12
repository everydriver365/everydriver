import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ca10d01ecc994c0b9186351c493398b9',
  appName: 'everydriver',
  webDir: 'dist',
  server: {
    url: 'https://ca10d01e-cc99-4c0b-9186-351c493398b9.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#F4F7F6',
  },
  android: {
    backgroundColor: '#F4F7F6',
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#F4F7F6',
      overlaysWebView: false,
    },
    SplashScreen: {
      backgroundColor: '#F4F7F6',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    NativeBiometric: {
      // iOS Info.plist additions handled by plugin; ensure NSFaceIDUsageDescription is set in Xcode
    },
  },
};

export default config;
