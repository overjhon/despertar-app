import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Cache global para o prompt - compartilhado entre todas as instâncias do hook
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

// Adicionar ao objeto window para fallback
declare global {
  interface Window {
    __deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

interface InstallPromptState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  canInstallPWA: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
}

export const useInstallPrompt = () => {
  const [state, setState] = useState<InstallPromptState>({
    isInstallable: false,
    isInstalled: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    canInstallPWA: false,
    deferredPrompt: null,
  });

  useEffect(() => {
    // Detect device and browser
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent);

    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    // Detect browsers that CAN support PWA (Chrome/Edge on desktop/Android, but not iOS)
    const canInstallPWA = (isChrome || /edge/.test(userAgent)) && !isIOS;

    setState(prev => ({
      ...prev,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      isInstalled,
      canInstallPWA,
    }));

    // Verificar se já existe um prompt global salvo
    if (globalDeferredPrompt || window.__deferredPrompt) {
      setState(prev => ({
        ...prev,
        deferredPrompt: globalDeferredPrompt || window.__deferredPrompt || null,
        isInstallable: true,
      }));
    }

    // Listen for beforeinstallprompt (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      // ⚠️ NOTA SOBRE WARNING DO CHROME:
      // O Chrome mostra um warning: "beforeinstallprompt.preventDefault() called. The page must call beforeinstallprompt.prompt()"
      // Este warning é ESPERADO e NÃO é um erro. É o comportamento correto para PWA customizado.
      // 
      // Por quê fazemos preventDefault()?
      // - Previne que o browser mostre o banner nativo de instalação automaticamente
      // - Nos permite controlar QUANDO mostrar o prompt (quando usuário clicar no botão "Instalar App")
      // - Salvamos o evento para chamar prompt() mais tarde, no momento certo
      //
      // O warning é apenas informativo - o Chrome alertando que capturamos o evento mas ainda não chamamos prompt().
      // Chamaremos prompt() quando o usuário clicar no botão de instalação (via promptInstall() abaixo).
      
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      
      // Salvar em múltiplos lugares para garantir acesso
      globalDeferredPrompt = installEvent;
      window.__deferredPrompt = installEvent;
      
      console.log('📱 PWA install prompt capturado e pronto para uso');
      
      setState(prev => ({
        ...prev,
        deferredPrompt: installEvent,
        isInstallable: true,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        deferredPrompt: null,
      }));
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    // Tentar pegar o prompt de múltiplas fontes (fallback robusto)
    const prompt = state.deferredPrompt || globalDeferredPrompt || window.__deferredPrompt;
    
    if (!prompt) {
      console.warn('No install prompt available');
      return false;
    }

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;

      if (outcome === 'accepted') {
        // Limpar todas as referências ao prompt
        globalDeferredPrompt = null;
        window.__deferredPrompt = null;
        
        setState(prev => ({
          ...prev,
          isInstallable: false,
          deferredPrompt: null,
        }));
        return true;
      }

      // Usuário rejeitou, limpar prompt
      globalDeferredPrompt = null;
      window.__deferredPrompt = null;
      
      setState(prev => ({
        ...prev,
        deferredPrompt: null,
      }));
      return false;
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  };

  const checkIOSStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
  };

  return {
    ...state,
    promptInstall,
    checkIOSStandalone,
  };
};
