import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { safeHardRefresh } from '@/lib/swRecovery';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReloadButton, setShowReloadButton] = useState(false);

  const handleClearCacheAndReload = async () => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('pdf-documents');
        const keys = await cache.keys();
        await Promise.all(keys.map(key => cache.delete(key)));
        console.log('🗑️ Cache de PDFs limpo ao voltar online');
      } catch (error) {
        console.error('Erro ao limpar cache:', error);
      }
    }
    
    // Recarregar se estiver em página de PDF
    if (window.location.pathname.includes('/reader') || 
        window.location.pathname.includes('/sample')) {
      window.location.reload();
    }
  };

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      
      // Mostrar botão de reload em páginas de PDF
      if (window.location.pathname.includes('/reader') || 
          window.location.pathname.includes('/sample')) {
        setShowReloadButton(true);
        
        // Auto-esconder após 10s
        setTimeout(() => setShowReloadButton(false), 10000);
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowReloadButton(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReloadButton) return null;

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground p-3 text-center z-50 shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Você está offline</span>
          <button
            onClick={safeHardRefresh}
            className="ml-2 px-3 py-1 bg-destructive-foreground text-destructive rounded text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Recuperar
          </button>
        </div>
      </div>
    );
  }

  if (showReloadButton) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-primary text-primary-foreground p-3 text-center z-50 shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm font-medium">Conexão restaurada!</span>
          <button
            onClick={handleClearCacheAndReload}
            className="ml-2 px-3 py-1 bg-primary-foreground text-primary rounded text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Recarregar PDFs
          </button>
        </div>
      </div>
    );
  }

  return null;
};
