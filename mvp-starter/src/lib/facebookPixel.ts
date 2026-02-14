// Type-safe Facebook Pixel wrapper

declare global {
  interface Window {
    fbq?: (action: string, event: string, params?: Record<string, any>) => void;
  }
}

/**
 * Verifica se o Facebook Pixel está disponível (não bloqueado por ad-blockers)
 */
const isPixelAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
};

/**
 * Track custom Facebook Pixel events
 * Silenciosamente falha se o pixel estiver bloqueado (ad-blocker)
 */
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  try {
    if (isPixelAvailable()) {
      window.fbq!('track', eventName, params);
    }
  } catch (error) {
    // Silenciosamente falha - Facebook Pixel pode estar bloqueado
    // console.debug não gera erro no console do usuário
    console.debug('Facebook Pixel não disponível:', error);
  }
};

/**
 * Track page view event
 */
export const trackPageView = () => {
  try {
    if (isPixelAvailable()) {
      window.fbq!('track', 'PageView');
    }
  } catch (error) {
    console.debug('Facebook Pixel não disponível:', error);
  }
};

/**
 * Track purchase event
 * @param value - Purchase value
 * @param currency - Currency code (e.g., 'BRL')
 * @param contentName - Name of the content/product
 */
export const trackPurchase = (value: number, currency: string = 'BRL', contentName?: string) => {
  try {
    if (isPixelAvailable()) {
      window.fbq!('track', 'Purchase', {
        value,
        currency,
        content_name: contentName,
      });
    }
  } catch (error) {
    console.debug('Facebook Pixel não disponível:', error);
  }
};

/**
 * Track view content event
 * @param contentName - Name of the content
 * @param contentType - Type of content
 * @param value - Optional value
 */
export const trackViewContent = (contentName: string, contentType: string = 'product', value?: number) => {
  try {
    if (isPixelAvailable()) {
      window.fbq!('track', 'ViewContent', {
        content_name: contentName,
        content_type: contentType,
        value,
      });
    }
  } catch (error) {
    console.debug('Facebook Pixel não disponível:', error);
  }
};

/**
 * Track lead event
 */
export const trackLead = () => {
  try {
    if (isPixelAvailable()) {
      window.fbq!('track', 'Lead');
    }
  } catch (error) {
    console.debug('Facebook Pixel não disponível:', error);
  }
};

/**
 * Track complete registration event
 */
export const trackCompleteRegistration = () => {
  try {
    if (isPixelAvailable()) {
      window.fbq!('track', 'CompleteRegistration');
    }
  } catch (error) {
    console.debug('Facebook Pixel não disponível:', error);
  }
};

/**
 * Track add to cart event
 * @param contentName - Name of the content/product
 * @param value - Optional value
 */
export const trackAddToCart = (contentName: string, value?: number) => {
  try {
    if (isPixelAvailable()) {
      window.fbq!('track', 'AddToCart', {
        content_name: contentName,
        value,
      });
    }
  } catch (error) {
    console.debug('Facebook Pixel não disponível:', error);
  }
};

/**
 * Track initiate checkout event
 * @param value - Optional value
 */
export const trackInitiateCheckout = (value?: number) => {
  try {
    if (isPixelAvailable()) {
      window.fbq!('track', 'InitiateCheckout', {
        value,
      });
    }
  } catch (error) {
    console.debug('Facebook Pixel não disponível:', error);
  }
};
