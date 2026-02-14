import { z } from 'zod';
/**
 * Validação de UUIDs e outros formatos
 */

/**
 * Valida se uma string é um UUID válido (v4)
 */
export const isValidUUID = (uuid: string | undefined): boolean => {
  if (!uuid) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Valida e retorna UUID ou null se inválido
 * Útil para validar route params antes de fazer fetch
 */
export const validateUUIDParam = (uuid: string | undefined, paramName: string = 'id'): string | null => {
  if (!isValidUUID(uuid)) {
    console.error(`❌ UUID inválido para ${paramName}:`, uuid);
    return null;
  }
  return uuid!;
};

// Schemas de validação usados nas telas de autenticação e onboarding
export const emailSchema = z
  .string({ required_error: 'Email é obrigatório' })
  .trim()
  .min(1, { message: 'Email é obrigatório' })
  .email({ message: 'Email inválido' })
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string({ required_error: 'Senha é obrigatória' })
  .min(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  .max(72, { message: 'A senha deve ter no máximo 72 caracteres' });

export const fullNameSchema = z
  .string({ required_error: 'Nome é obrigatório' })
  .trim()
  .min(3, { message: 'Informe seu nome completo' })
  .max(80, { message: 'Nome muito longo' });

// Schemas de depoimentos
export const ratingSchema = z
  .number({ required_error: 'Avaliação é obrigatória' })
  .int({ message: 'Avaliação deve ser um número inteiro' })
  .min(1, { message: 'Avalie entre 1 e 5 estrelas' })
  .max(5, { message: 'Avalie entre 1 e 5 estrelas' });

export const testimonialTitleSchema = z
  .string({ required_error: 'Título é obrigatório' })
  .trim()
  .min(3, { message: 'O título deve ter pelo menos 3 caracteres' })
  .max(100, { message: 'O título deve ter no máximo 100 caracteres' });

export const testimonialContentSchema = z
  .string({ required_error: 'Depoimento é obrigatório' })
  .trim()
  .min(20, { message: 'O depoimento deve ter pelo menos 20 caracteres' })
  .max(1000, { message: 'O depoimento deve ter no máximo 1000 caracteres' });

// Schema de conteúdo de post da comunidade
export const postContentSchema = z
  .string({ required_error: 'Conteúdo é obrigatório' })
  .trim()
  .min(1, { message: 'Escreva algo para publicar' })
  .max(2000, { message: 'O conteúdo deve ter no máximo 2000 caracteres' });
