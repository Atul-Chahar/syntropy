import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.atulchahar.syntropy',
  appName: 'Syntropy',
  webDir: 'out',
  backgroundColor: '#0B0F0D',
  android: {
    backgroundColor: '#0B0F0D',
  },
  plugins: {
    // Edge-to-edge: Capacitor injects --safe-area-inset-* CSS variables; light icons on the void.
    SystemBars: { insetsHandling: 'css', style: 'DARK' },
    SplashScreen: { launchShowDuration: 600, backgroundColor: '#0B0F0D', showSpinner: false },
    Keyboard: { resizeOnFullScreen: true },
    LocalNotifications: { iconColor: '#FF6B3D' },
  },
}

export default config
