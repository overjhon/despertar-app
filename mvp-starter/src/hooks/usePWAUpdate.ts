import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { safeHardRefresh } from '@/lib/swRecovery';

export const usePWAUpdate = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const hasShownToast = useRef(false);
  const isRefreshing = useRef(false);
  const initialControllerRef = useRef<ServiceWorker | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Store initial controller state
      if (navigator.serviceWorker.controller) {
        initialControllerRef.current = navigator.serviceWorker.controller;
      }

      // Wait 2 seconds before allowing notifications to prevent false positives on first load
      const initTimer = setTimeout(() => {
        hasInitialized.current = true;
      }, 2000);

      // Check for updates every hour
      const updateInterval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then((reg) => {
          reg?.update();
        });
      }, 60 * 60 * 1000);

      // Listen for updates
      const handleControllerChange = () => {
        // Only show toast if:
        // 1. Has initialized (2s timeout passed)
        // 2. There was a previous controller (not first install)
        // 3. Not currently refreshing
        // 4. Haven't shown toast yet
        if (
          hasInitialized.current &&
          initialControllerRef.current &&
          !isRefreshing.current &&
          !hasShownToast.current
        ) {
          // Verify there's actually a waiting worker
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg?.waiting) {
              hasShownToast.current = true;
              setNeedRefresh(true);
              
              toast.info('Nova versão disponível!', {
                description: 'Clique para atualizar o app',
                duration: 5000,
                action: {
                  label: 'Atualizar agora',
                  onClick: () => {
                    isRefreshing.current = true;
                    safeHardRefresh();
                  },
                },
              });
            }
          });
        }
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Cleanup
      return () => {
        clearTimeout(initTimer);
        clearInterval(updateInterval);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  return { needRefresh };
};
