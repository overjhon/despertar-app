/**
 * Utilitários para detecção de dispositivos e plataformas
 */

export const isAndroid = (): boolean => {
  return /android/i.test(navigator.userAgent);
};

export const isIOS = (): boolean => {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
};

export const isMobileDevice = (): boolean => {
  return isAndroid() || isIOS();
};

export const isSafari = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export const isPWAStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

export const isAndroidWebView = (): boolean => {
  return isAndroid() && /wv/.test(navigator.userAgent);
};

export const getDeviceInfo = () => {
  return {
    isAndroid: isAndroid(),
    isIOS: isIOS(),
    isMobile: isMobileDevice(),
    isSafari: isSafari(),
    isPWA: isPWAStandalone(),
    isWebView: isAndroidWebView(),
    userAgent: navigator.userAgent
  };
};
