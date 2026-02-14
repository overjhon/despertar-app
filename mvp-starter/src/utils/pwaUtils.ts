export const detectPWAStatus = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  return {
    isInstalled: isStandalone || isIOSStandalone,
    isPWACapable: 'serviceWorker' in navigator && 'PushManager' in window,
  };
};

export const getDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  return {
    isIOS: /iphone|ipad|ipod/.test(userAgent),
    isAndroid: /android/.test(userAgent),
    isMobile: /mobile|android|iphone|ipad|ipod/.test(userAgent),
    isDesktop: !/mobile|android|iphone|ipad|ipod/.test(userAgent),
  };
};

export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  return {
    isChrome: /chrome/.test(userAgent) && !/edge/.test(userAgent),
    isSafari: /safari/.test(userAgent) && !/chrome/.test(userAgent),
    isFirefox: /firefox/.test(userAgent),
    isEdge: /edge/.test(userAgent),
    isOpera: /opera|opr/.test(userAgent),
  };
};

export const canShowNativePrompt = () => {
  const { isChrome, isEdge } = getBrowserInfo();
  const { isAndroid, isDesktop } = getDeviceType();
  
  // Native prompt works on Chrome/Edge on Android and Desktop
  return (isChrome || isEdge) && (isAndroid || isDesktop);
};

export const getInstallInstructions = () => {
  const { isIOS, isAndroid } = getDeviceType();
  const { isSafari, isChrome, isFirefox } = getBrowserInfo();

  if (isIOS) {
    return {
      platform: 'iOS',
      browser: 'Safari',
      steps: [
        'Toque no botão Compartilhar (quadrado com seta para cima)',
        'Role até encontrar "Adicionar à Tela Inicial"',
        'Toque em "Adicionar"',
      ],
    };
  }

  if (isAndroid && isChrome) {
    return {
      platform: 'Android',
      browser: 'Chrome',
      steps: [
        'Toque nos 3 pontos no canto superior direito',
        'Selecione "Adicionar à tela inicial"',
        'Confirme tocando em "Adicionar"',
      ],
    };
  }

  if (isAndroid && isFirefox) {
    return {
      platform: 'Android',
      browser: 'Firefox',
      steps: [
        'Toque nos 3 pontos no menu',
        'Selecione "Instalar"',
        'Confirme a instalação',
      ],
    };
  }

  return {
    platform: 'Desktop',
    browser: 'Browser',
    steps: [
      'Procure o ícone de instalação na barra de endereços',
      'Ou use o menu do navegador e selecione "Instalar app"',
      'Confirme a instalação',
    ],
  };
};
