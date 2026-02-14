/**
 * Service Worker Recovery Utilities
 * Provides functions to unregister SW, clear caches, and perform hard refresh
 */

export const unregisterServiceWorkers = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log('✅ Service workers unregistered');
    } catch (error) {
      console.error('❌ Failed to unregister service workers:', error);
    }
  }
};

export const clearAllCaches = async (): Promise<void> => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('✅ All caches cleared');
    } catch (error) {
      console.error('❌ Failed to clear caches:', error);
    }
  }
};

export const safeHardRefresh = async (): Promise<void> => {
  try {
    console.log('🔄 Starting safe hard refresh...');
    
    // Clear session/local storage if needed (optional)
    // sessionStorage.clear();
    
    await unregisterServiceWorkers();
    await clearAllCaches();
    
    // Remove query parameters and reload
    const baseUrl = window.location.origin + window.location.pathname;
    window.location.replace(baseUrl);
  } catch (error) {
    console.error('❌ Error during safe hard refresh:', error);
    // Fallback to simple reload
    window.location.reload();
  }
};

// Listen for force-refresh messages
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    if (event.data === 'force-refresh') {
      safeHardRefresh();
    }
  });
}
