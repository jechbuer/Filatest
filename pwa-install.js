/**
 * Filament Store - PWA Installation Helper
 * Handles service worker registration and PWA install prompts
 */

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[PWA] Service Worker registered:', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            showUpdateNotification();
          }
        });
      });
      
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  });
  
  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'SYNC_COMPLETE') {
      console.log('[PWA] Background sync completed at', new Date(event.data.timestamp));
    }
  });
}

// PWA Install Prompt
let deferredPrompt = null;
const installButton = document.getElementById('pwa-install-button');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Store the event for later use
  deferredPrompt = e;
  // Show install button or banner
  showInstallBanner();
  console.log('[PWA] Install prompt available');
});

window.addEventListener('appinstalled', () => {
  // Hide install button/banner
  hideInstallBanner();
  deferredPrompt = null;
  console.log('[PWA] App was installed');
  
  // Track installation (optional)
  if (typeof gtag !== 'undefined') {
    gtag('event', 'pwa_install', {
      'event_category': 'PWA',
      'event_label': 'Filament Store'
    });
  }
});

// Check if app is already installed
function isPWAInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

// Show install banner
function showInstallBanner() {
  // Create banner if it doesn't exist
  let banner = document.getElementById('pwa-install-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 z-50 flex justify-between items-center shadow-lg';
    banner.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-2xl">🧵</span>
        <div>
          <div class="font-bold">Filament Store installieren</div>
          <div class="text-sm text-blue-100">Schneller Zugriff, Offline-Nutzung</div>
        </div>
      </div>
      <div class="flex gap-2">
        <button onclick="hideInstallBanner()" class="px-3 py-1 text-sm text-blue-200 hover:text-white">Später</button>
        <button onclick="installPWA()" class="px-4 py-2 bg-white text-blue-600 rounded font-medium text-sm hover:bg-blue-50">Installieren</button>
      </div>
    `;
    document.body.appendChild(banner);
  }
  banner.classList.remove('hidden');
}

// Hide install banner
function hideInstallBanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.classList.add('hidden');
  }
}

// Trigger PWA installation
async function installPWA() {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return;
  }
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for user choice
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`[PWA] User ${outcome === 'accepted' ? 'installed' : 'dismissed'} the app`);
  
  // Clear the deferred prompt
  deferredPrompt = null;
  hideInstallBanner();
}

// Show update notification
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-3';
  notification.innerHTML = `
    <span>✨ Neue Version verfügbar!</span>
    <button onclick="updateApp()" class="underline font-medium hover:no-underline">Aktualisieren</button>
  `;
  document.body.appendChild(notification);
  
  // Auto-remove after 10 seconds
  setTimeout(() => notification.remove(), 10000);
}

// Update the app
function updateApp() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.waiting?.postMessage('SKIP_WAITING');
      window.location.reload();
    });
  }
}

// Background sync registration
async function registerBackgroundSync(tag = 'sync-filaments') {
  if ('serviceWorker' in navigator && 'sync' in registration) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
    } catch (error) {
      console.error('[PWA] Background sync failed:', error);
    }
  }
}

// Push notification subscription (for low stock alerts)
async function subscribeToNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[PWA] Push notifications not supported');
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
    });
    
    // Send subscription to server
    console.log('[PWA] Push subscription:', subscription);
    
  } catch (error) {
    console.error('[PWA] Push subscription failed:', error);
  }
}

// Helper: Convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check online/offline status
window.addEventListener('online', () => {
  console.log('[PWA] App is online');
  document.body.classList.remove('offline');
});

window.addEventListener('offline', () => {
  console.log('[PWA] App is offline');
  document.body.classList.add('offline');
});

// Export for global access
window.PWAHelper = {
  isInstalled: isPWAInstalled,
  install: installPWA,
  showInstallBanner,
  hideInstallBanner,
  registerBackgroundSync,
  subscribeToNotifications
};

console.log('[PWA] Helper loaded');
