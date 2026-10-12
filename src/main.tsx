import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';

// Register the PWA service worker only in a browser. Native Android WebView
// uses the app bundle managed by Capacitor and should not install a web SW.
if (!Capacitor.isNativePlatform()) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById('root')!).render(<App />);

