import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { enforceHTTPS, setSecurityHeaders } from "./lib/httpsEnforcement";
import { initWebVitals } from "./lib/webVitals";
import { safeHardRefresh } from "./lib/swRecovery";

// Boot guard - prevent double execution
if ((window as any).__appBooted) {
  console.warn('⚠️ App already booted, aborting duplicate script execution');
  throw new Error('Duplicate boot prevented');
}
(window as any).__appBooted = true;

console.log('🚀 BOOT:start', new Date().toISOString());

// Check URL parameters early
const urlParams = new URLSearchParams(window.location.search);
const debugMode = urlParams.get('debug') === '1';

// Check for flush parameter before anything else
if (urlParams.get('flush') === '1') {
  console.log('🔄 Flush parameter detected, performing hard refresh...');
  safeHardRefresh();
  throw new Error('Flushing app...');
}

// Boot fail-safe management
const bootFailsafe = document.getElementById('boot-failsafe');
const bootMessage = document.getElementById('boot-message');
const bootActions = document.getElementById('boot-actions');

let bootTimeout: number;
let appMounted = false;

const hideBootOverlay = () => {
  if (bootFailsafe && !appMounted) {
    appMounted = true;
    bootFailsafe.classList.add('hidden');
    if (bootTimeout) clearTimeout(bootTimeout);
    console.log('✅ BOOT:render-succeeded');
  }
};

const showBootError = (message: string) => {
  console.error('❌ Boot error:', message);
  if (bootMessage) bootMessage.textContent = message;
  if (bootActions) bootActions.style.display = 'block';
  localStorage.setItem('__boot_error__', JSON.stringify({ 
    message, 
    timestamp: Date.now() 
  }));
};

const showDebugInfo = async () => {
  if (!debugMode || !bootMessage) return;
  
  try {
    const diagnostics = [];
    
    // Service Worker status
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      diagnostics.push(`SW: ${registrations.length} registrations`);
      if (navigator.serviceWorker.controller) {
        diagnostics.push(`SW controller: active`);
      }
    }
    
    // Cache status
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      diagnostics.push(`Caches: ${cacheNames.length} (${cacheNames.slice(0, 3).join(', ')}...)`);
    }
    
    // Last boot error
    const lastError = localStorage.getItem('__boot_error__');
    if (lastError) {
      const errorData = JSON.parse(lastError);
      diagnostics.push(`Last error: ${errorData.message}`);
    }
    
    // Environment
    diagnostics.push(`Host: ${window.location.hostname}`);
    diagnostics.push(`In iframe: ${window.top !== window.self}`);
    diagnostics.push(`UA: ${navigator.userAgent.substring(0, 50)}...`);
    
    if (bootMessage) {
      bootMessage.innerHTML = `
        <strong>🔍 Debug Mode</strong><br/>
        ${diagnostics.join('<br/>')}
      `;
    }
    if (bootActions) bootActions.style.display = 'block';
  } catch (error) {
    console.error('Failed to show debug info:', error);
  }
};

// Expose global recovery function
(window as any).__safeRefresh = safeHardRefresh;

// Early error handlers (before React)
window.onerror = (message, source, lineno, colno, error) => {
  console.error('💥 Early boot error:', { message, source, lineno, error });
  showBootError(`Erro ao carregar: ${message}`);
  return false;
};

window.onunhandledrejection = (event) => {
  const reason = event.reason;
  console.error('💥 Early promise rejection:', reason);

  // Detect dynamic import/chunk load errors
  const isChunkError = reason?.message?.includes('Failed to fetch dynamically imported module') ||
                       reason?.message?.includes('ChunkLoadError') ||
                       reason?.name === 'ChunkLoadError';
  // Ignore aborted network requests (common during fast navigations/HMR)
  const isAborted = typeof reason?.message === 'string' && reason.message.includes('ERR_ABORTED');

  if (isAborted) {
    console.warn('⏭️ Ignorando erro abortado de rede (benigno).');
    return;
  }

  if (isChunkError) {
    console.error('🚨 Chunk load error detected:', reason);

    // In development, do not block boot — these are often benign during HMR
    if (import.meta.env.DEV) {
      console.warn('🛠️ Dev mode: suprimindo overlay para chunk error.');
      return;
    }

    // In production, attempt a one-time safe hard refresh to heal cache/SW
    const retriedKey = '__chunk_error_retried__';
    const hasRetried = sessionStorage.getItem(retriedKey) === '1';
    if (!hasRetried) {
      sessionStorage.setItem(retriedKey, '1');
      console.warn('🔄 Tentando recuperação automática (safeHardRefresh)...');
      safeHardRefresh();
      return;
    }

    showBootError(`
      ❌ Falha ao carregar recursos do app.<br/>
      <small>Possível cache antigo ou conexão instável.</small><br/>
      <strong>Tente:</strong> /?flush=1 ou /recovery
    `);
  } else {
    showBootError(`Erro ao inicializar: ${reason?.message || 'Falha desconhecida'}`);
  }
};

// Relaxed handling for early window errors: ignore aborted network fetches
window.onerror = (message, source, lineno, colno, error) => {
  const msg = typeof message === 'string' ? message : String(message);
  const aborted = msg.includes('ERR_ABORTED');
  if (aborted) {
    console.warn('⏭️ Ignorando erro abortado de rede em onerror.', { message, source });
    return true; // prevent default handling
  }
  console.error('💥 Early boot error:', { message, source, lineno, error });
  showBootError(`Erro ao carregar: ${msg}`);
  return false;
};

// Show debug info if in debug mode
if (debugMode) {
  showDebugInfo();
}

// Watchdog: if boot takes > 6 seconds, show recovery options
bootTimeout = window.setTimeout(() => {
  if (!appMounted) {
    console.warn('⏱️ Boot timeout - app may be stuck');
    showBootError('⏱️ O carregamento está demorando muito. Tente recuperar o app.');
  }
}, 6000);

// Apply security configurations
try {
  console.log('🔒 BOOT:security-headers');
  enforceHTTPS();
  setSecurityHeaders();
} catch (error) {
  console.error('Security setup error:', error);
}

// Initialize Web Vitals monitoring
if (typeof window !== 'undefined') {
  console.log('📊 BOOT:web-vitals');
  initWebVitals();
}

// Clear old caches on app start (production only)
if ('caches' in window && import.meta.env.PROD) {
  caches.keys().then((names) => {
    names.forEach((name) => {
      if (name.includes('workbox') || name.includes('pwa')) {
        caches.delete(name);
      }
    });
  });
  
  // Limpar cache de PDFs expirados especificamente
  caches.open('ebooks-storage').then((cache) => {
    cache.keys().then((requests) => {
      console.log('[CACHE] Limpando cache de PDFs antigos');
      requests.forEach((request) => {
        cache.delete(request);
      });
    });
  }).catch(err => console.log('[CACHE] Erro ao limpar PDFs:', err));
}

// Render app with error handling
try {
  console.log('⚛️ BOOT:pre-render');
  createRoot(document.getElementById("root")!).render(<App />);
  console.log('✅ BOOT:render-called');
  
  // Give React 100ms to mount, then hide overlay
  setTimeout(() => {
    hideBootOverlay();
  }, 100);
  
} catch (error) {
  console.error('💥 Failed to render app:', error);
  const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
  showBootError(`💥 Falha ao renderizar: ${errorMsg}`);
  
  if (debugMode && bootMessage) {
    bootMessage.innerHTML += `<br/><br/><small>Stack: ${error instanceof Error ? error.stack : 'N/A'}</small>`;
  }
}
