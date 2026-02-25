export const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || 'Despertar da Mulher';
export const BASE_URL = import.meta.env.VITE_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
export const DEFAULT_DESCRIPTION = import.meta.env.VITE_DEFAULT_DESCRIPTION || 'Sua plataforma de conversas, conexões e despertar feminino.';
export const SOCIAL_IMAGE = import.meta.env.VITE_SOCIAL_IMAGE || '/og-image.jpg';
export const PWA_DESCRIPTION = import.meta.env.VITE_PWA_DESCRIPTION || DEFAULT_DESCRIPTION;

export const getBaseHostname = () => {
  try {
    const u = new URL(BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost'));
    return u.hostname;
  } catch {
    return 'localhost';
  }
};