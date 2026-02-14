/**
 * Utilitário para limpar caches antigos de PDFs e outros assets
 */
export const clearOldPdfCaches = async (): Promise<void> => {
  if (!('caches' in window)) {
    console.warn('[CACHE] Cache API não disponível');
    return;
  }

  try {
    const cacheNames = await caches.keys();
    const pdfCaches = cacheNames.filter(name => 
      name.includes('pdf') || 
      name.includes('ebooks-storage') ||
      name.includes('pdf-cache')
    );

    console.log('[CACHE] Caches de PDF encontrados:', pdfCaches);

    await Promise.all(pdfCaches.map(name => {
      console.log('[CACHE] Deletando cache:', name);
      return caches.delete(name);
    }));

    console.log('✅ Caches de PDF limpos com sucesso');
  } catch (error) {
    console.error('❌ Erro ao limpar caches de PDF:', error);
  }
};

/**
 * Limpa todos os caches exceto os da workbox
 */
export const clearAllNonWorkboxCaches = async (): Promise<void> => {
  if (!('caches' in window)) {
    console.warn('[CACHE] Cache API não disponível');
    return;
  }

  try {
    const cacheNames = await caches.keys();
    const cacheWhitelist = ['workbox-runtime', 'workbox-precache'];

    const cachesToDelete = cacheNames.filter(name => 
      !cacheWhitelist.some(prefix => name.startsWith(prefix))
    );

    console.log('[CACHE] Caches a deletar:', cachesToDelete);

    await Promise.all(cachesToDelete.map(name => {
      console.log('[CACHE] Deletando cache:', name);
      return caches.delete(name);
    }));

    console.log('✅ Todos os caches não-workbox foram limpos');
  } catch (error) {
    console.error('❌ Erro ao limpar caches:', error);
  }
};
