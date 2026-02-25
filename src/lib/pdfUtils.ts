import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from './validation';

/**
 * Verifica se a string é uma URL HTTP válida
 */
const isValidHttpUrl = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;

  // Rejeita se for apenas um UUID (erro comum)
  if (isValidUUID(str)) {
    console.error('❌ Tentativa de usar UUID como URL de PDF:', str);
    return false;
  }

  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Sanitiza e valida PDF path/URL
 */
export const sanitizePdfPath = (pdfPath: string | undefined | null): string | null => {
  if (!pdfPath) {
    console.error('❌ PDF path está vazio ou undefined');
    return null;
  }

  const trimmed = pdfPath.trim();

  // Se for apenas UUID, isso é um erro - não deve acontecer
  if (isValidUUID(trimmed)) {
    console.error('❌ ERRO: pdf_url no banco é apenas UUID, deveria ser URL completa:', trimmed);
    console.error('💡 Dica: Atualize o registro no banco com a URL completa do Storage');
    return null;
  }

  return trimmed;
};

/**
 * Gera uma URL pública para acessar PDFs em buckets PÚBLICOS (samples, covers)
 * @param pdfPath - Caminho do PDF no bucket
 * @param bucket - Nome do bucket (padrão: 'samples')
 * @returns URL pública ou null se inválido
 */
export const getPublicPdfUrl = (pdfPath: string | undefined | null, bucket: string = 'samples'): string | null => {
  const sanitized = sanitizePdfPath(pdfPath);
  if (!sanitized) return null;

  // Se já for uma URL completa e válida, retornar diretamente
  if (isValidHttpUrl(sanitized)) {
    console.log('✅ PDF já é URL completa:', sanitized);
    return sanitized;
  }

  // Limpar path
  const cleanPath = sanitized
    .replace(/^\/ebooks\//, '')
    .replace(/^ebooks\//, '')
    .replace(/^\/samples\//, '')
    .replace(/^samples\//, '');

  console.log(`🔓 Gerando URL pública (${bucket}):`, cleanPath);

  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(cleanPath);

    if (!data?.publicUrl) {
      console.error('❌ Falha ao gerar URL pública');
      return null;
    }

    console.log('✅ URL pública gerada:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('❌ Erro ao gerar URL pública:', error);
    return null;
  }
};

/**
 * Gera uma URL assinada (temporária) para acessar PDFs no bucket PRIVADO 'ebooks'
 * Requer que o usuário esteja autenticado (session ativa no Supabase)
 * @param pdfPath - Caminho do PDF no bucket ebooks
 * @param expiresInSeconds - Tempo de expiração em segundos (padrão: 3600 = 1 hora)
 * @returns URL assinada ou null se falhar
 */
export const getSignedPdfUrl = async (
  pdfPath: string | undefined | null,
  expiresInSeconds: number = 3600
): Promise<string | null> => {
  const sanitized = sanitizePdfPath(pdfPath);
  if (!sanitized) return null;

  // Se já for uma URL assinada válida (com token), retornar diretamente
  if (isValidHttpUrl(sanitized) && sanitized.includes('token=')) {
    console.log('✅ PDF já é URL assinada:', sanitized);
    return sanitized;
  }

  // Extrair o path relativo do bucket
  let finalPath = sanitized;

  // Se for uma URL completa, extrair apenas o path relativo
  if (isValidHttpUrl(sanitized)) {
    try {
      const url = new URL(sanitized);
      // Match tanto /object/public/ebooks/ quanto /object/sign/ebooks/
      const match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/ebooks\/(.+)/);
      if (match) {
        finalPath = decodeURIComponent(match[1]);
        console.log('📋 Path extraído da URL pública:', finalPath);
      } else {
        console.warn('⚠️ URL não contém path reconhecível de bucket ebooks:', sanitized);
      }
    } catch { /* usa sanitized como está */ }
  }

  // Limpar prefixos residuais de bucket
  finalPath = finalPath
    .replace(/^\/ebooks\//, '')
    .replace(/^ebooks\//, '');

  console.log('🔐 Gerando URL assinada para:', finalPath);

  try {
    const { data, error } = await supabase.storage
      .from('ebooks')
      .createSignedUrl(finalPath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.error('❌ Falha ao gerar URL assinada:', error?.message);
      return null;
    }

    console.log('✅ URL assinada gerada (expira em', expiresInSeconds, 's)');
    return data.signedUrl;
  } catch (error) {
    console.error('❌ Erro ao gerar URL assinada:', error);
    return null;
  }
};

/**
 * Valida se uma URL de PDF está acessível com fallback robusto
 * @param url - URL do PDF para validar
 * @returns true se a URL está acessível, false caso contrário
 */
export const validatePdfUrl = async (url: string | undefined | null): Promise<boolean> => {
  const sanitized = sanitizePdfPath(url);
  if (!sanitized) return false;

  // Verificar se é uma URL HTTP válida
  if (!isValidHttpUrl(sanitized)) {
    console.error('❌ String fornecida não é uma URL HTTP válida:', sanitized);
    return false;
  }

  const validUrl = sanitized;
  try {
    console.log('🔍 Validando acesso ao PDF:', validUrl);

    // Primeira tentativa: HEAD request
    const headResponse = await Promise.race([
      fetch(validUrl, {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      }),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000)
      )
    ]);

    if (headResponse.ok) {
      console.log('✅ PDF URL válida (HEAD)', validUrl);
      return true;
    }

    // Log específico para erros HTTP
    if (headResponse.status === 404) {
      console.error('❌ PDF não encontrado (404):', validUrl);
      console.error('💡 Verifique se o arquivo existe no Storage do Supabase');
      return false;
    } else if (headResponse.status === 403) {
      console.error('❌ Acesso negado ao PDF (403):', validUrl);
      console.error('💡 Verifique as políticas de acesso do bucket no Supabase');
      return false;
    } else {
      console.warn(`⚠️ HEAD retornou status ${headResponse.status}, tentando GET...`);
    }
  } catch (headError) {
    console.warn('⚠️ HEAD falhou, tentando GET com range...', headError);

    // Segunda tentativa: GET com range mínimo
    try {
      const getResponse = await Promise.race([
        fetch(validUrl, {
          method: 'GET',
          headers: { 'Range': 'bytes=0-0' },
          mode: 'cors',
          cache: 'no-cache'
        }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 3000)
        )
      ]);

      // Log específico para erros HTTP no GET
      if (getResponse.status === 404) {
        console.error('❌ PDF não encontrado (404) em GET:', validUrl);
        console.error('💡 Verifique se o arquivo existe no Storage do Supabase');
        return false;
      } else if (getResponse.status === 403) {
        console.error('❌ Acesso negado ao PDF (403) em GET:', validUrl);
        console.error('💡 Verifique as políticas de acesso do bucket no Supabase');
        return false;
      }

      const isValid = getResponse.ok || getResponse.status === 206;
      console.log(isValid ? '✅ PDF URL válida (GET)' : `❌ PDF URL inválida (status ${getResponse.status})`, validUrl);
      return isValid;
    } catch (getRangeError) {
      console.error('❌ Ambas validações falharam para:', validUrl);
      console.error('Erro:', getRangeError);
      return false;
    }
  }

  return false;
};

/**
 * Cria um ObjectURL a partir de um PDF remoto via Blob
 * @param url - URL do PDF para converter
 * @returns ObjectURL ou null se falhar
 */
export const createObjectUrlFromPdf = async (url: string): Promise<string | null> => {
  try {
    console.log('🔄 Criando Blob URL para:', url);

    const response = await Promise.race([
      fetch(url, {
        mode: 'cors',
        cache: 'default'
      }),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      )
    ]);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    console.log('✅ Blob URL criado:', objectUrl);
    return objectUrl;
  } catch (error) {
    console.error('❌ Falha ao criar Blob URL:', error);
    return null;
  }
};
