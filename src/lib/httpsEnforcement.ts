/**
 * Força redirecionamento HTTPS em produção
 * Executa apenas uma vez no carregamento da aplicação
 */

export const enforceHTTPS = () => {
  // Não forçar em desenvolvimento
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.lovableproject.com')
  ) {
    return;
  }

  // Não forçar se estiver atrás do Cloudflare (ele já gerencia HTTPS)
  const baseHost = getBaseHostname();
  if (
    window.location.hostname === baseHost ||
    window.location.hostname.includes('cloudflare')
  ) {
    return;
  }

  // Se não estiver em HTTPS, redirecionar
  if (window.location.protocol !== 'https:') {
    console.warn('🔒 Redirecionando para HTTPS...');
    window.location.href = `https://${window.location.href.substring(window.location.protocol.length + 2)}`;
  }
};

/**
 * Configura headers de segurança via meta tags
 */
export const setSecurityHeaders = () => {
  // Strict Transport Security (informativo, headers reais vêm do servidor)
  const hstsTag = document.createElement('meta');
  hstsTag.httpEquiv = 'Strict-Transport-Security';
  hstsTag.content = 'max-age=31536000; includeSubDomains';
  document.head.appendChild(hstsTag);

  // X-Content-Type-Options
  const noSniffTag = document.createElement('meta');
  noSniffTag.httpEquiv = 'X-Content-Type-Options';
  noSniffTag.content = 'nosniff';
  document.head.appendChild(noSniffTag);

  // NOTE: X-Frame-Options não pode ser definido via meta tag
  // Ele deve ser configurado via HTTP headers reais no servidor/CDN
  // A tentativa de usar meta tag gera warning no console sem efeito real

  // Referrer Policy
  const referrerTag = document.createElement('meta');
  referrerTag.name = 'referrer';
  referrerTag.content = 'strict-origin-when-cross-origin';
  document.head.appendChild(referrerTag);

  console.log('🛡️ Security headers configurados');
};
import { getBaseHostname } from '@/config/brand';
