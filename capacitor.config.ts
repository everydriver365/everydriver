import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ca10d01ecc994c0b9186351c493398b9',
  appName: 'everydriver',
  webDir: 'dist',
  server: {
    // Point the native wrapper at the PUBLISHED app, not the sandbox preview.
    // This way Despia/TestFlight pick up every Lovable Publish automatically
    // (combined with the bundle-refresh logic in src/lib/bundleRefresh.ts).
    url: 'https://everydriver.lovable.app',
    cleartext: true,
    androidScheme: 'https',
    iosScheme: 'https',
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
      // Light background (#F4F7F6) → use DARK content (dark text/icons) so it's legible
      style: 'DARK',
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
