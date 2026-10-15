import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/royal-pay-ui-refresh.css';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { registerSW } from 'virtual:pwa-register';

// Native WebView content must not draw underneath the Android status bar; this is
// separate from CSS safe-area handling and prevents the top header from being clipped.
if (Capacitor.isNativePlatform()) {
  void StatusBar.setOverlaysWebView({ overlay: false }).catch((error) => {
    console.warn('Unable to configure native status-bar overlay:', error);
  });
  void StatusBar.setBackgroundColor({ color: '#043A2B' }).catch((error) => {
    console.warn('Unable to configure native status-bar color:', error);
  });
  void StatusBar.setStyle({ style: Style.Light }).catch((error) => {
    console.warn('Unable to configure native status-bar style:', error);
  });
}

// Register the PWA service worker only in a browser. Native Android WebView
// uses the app bundle managed by Capacitor and should not install a web SW.
if (!Capacitor.isNativePlatform()) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById('root')!).render(<App />);

