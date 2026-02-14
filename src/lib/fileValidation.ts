/**
 * Validação avançada de arquivos com verificação de MIME type real
 * Previne upload de arquivos maliciosos disfarçados
 */

interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * MIME types permitidos por categoria
 */
const ALLOWED_MIME_TYPES = {
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  videos: [
    'video/mp4',
    'video/quicktime',
    'video/webm',
  ],
  documents: [
    'application/pdf',
  ],
};

/**
 * Limites de tamanho por tipo (em bytes)
 */
const SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024, // 50MB
  document: 20 * 1024 * 1024, // 20MB
};

/**
 * Lê os primeiros bytes do arquivo para detectar o MIME type real
 * Isso previne arquivos maliciosos com extensão falsificada
 */
const getFileMimeType = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = (e) => {
      if (!e.target?.result) {
        reject(new Error('Failed to read file'));
        return;
      }

      const arr = new Uint8Array(e.target.result as ArrayBuffer).subarray(0, 4);
      let header = '';
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
      }

      // Magic numbers para detecção de tipo
      let mimeType = file.type;
      
      switch (header) {
        case '89504e47': // PNG
          mimeType = 'image/png';
          break;
        case '47494638': // GIF
          mimeType = 'image/gif';
          break;
        case 'ffd8ffe0': // JPEG
        case 'ffd8ffe1':
        case 'ffd8ffe2':
        case 'ffd8ffe3':
        case 'ffd8ffe8':
          mimeType = 'image/jpeg';
          break;
        case '52494646': // WEBP
          mimeType = 'image/webp';
          break;
        case '25504446': // PDF
          mimeType = 'application/pdf';
          break;
        case '66747970': // MP4/MOV
          mimeType = 'video/mp4';
          break;
        case '1a45dfa3': // WEBM
          mimeType = 'video/webm';
          break;
      }

      resolve(mimeType);
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
};

/**
 * Valida se o arquivo é uma imagem permitida
 */
export const validateImage = async (file: File): Promise<FileValidationResult> => {
  // Verificar tamanho
  if (file.size > SIZE_LIMITS.image) {
    return {
      valid: false,
      error: `Imagem muito grande. Máximo ${SIZE_LIMITS.image / 1024 / 1024}MB`,
    };
  }

  // Verificar MIME type real
  try {
    const realMimeType = await getFileMimeType(file);
    
    if (!ALLOWED_MIME_TYPES.images.includes(realMimeType)) {
      return {
        valid: false,
        error: 'Tipo de imagem não permitido. Use JPEG, PNG, WebP ou GIF',
      };
    }

    // Verificar se MIME type declarado corresponde ao real
    if (file.type && file.type !== realMimeType) {
      console.warn(`MIME type mismatch: declared ${file.type}, actual ${realMimeType}`);
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Falha ao validar arquivo',
    };
  }
};

/**
 * Valida se o arquivo é um vídeo permitido
 */
export const validateVideo = async (file: File): Promise<FileValidationResult> => {
  // Verificar tamanho
  if (file.size > SIZE_LIMITS.video) {
    return {
      valid: false,
      error: `Vídeo muito grande. Máximo ${SIZE_LIMITS.video / 1024 / 1024}MB`,
    };
  }

  // Verificar MIME type real
  try {
    const realMimeType = await getFileMimeType(file);
    
    if (!ALLOWED_MIME_TYPES.videos.includes(realMimeType)) {
      return {
        valid: false,
        error: 'Tipo de vídeo não permitido. Use MP4, QuickTime ou WebM',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Falha ao validar arquivo',
    };
  }
};

/**
 * Valida múltiplos arquivos
 */
export const validateFiles = async (
  files: File[],
  type: 'image' | 'video'
): Promise<FileValidationResult> => {
  const validator = type === 'image' ? validateImage : validateVideo;
  
  for (const file of files) {
    const result = await validator(file);
    if (!result.valid) {
      return result;
    }
  }
  
  return { valid: true };
};

/**
 * Sanitiza o nome do arquivo removendo caracteres perigosos
 */
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui caracteres especiais
    .replace(/_{2,}/g, '_') // Remove underscores duplicados
    .toLowerCase();
};
