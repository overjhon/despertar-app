import { supabase } from '@/integrations/supabase/client';

interface RateLimitResult {
  allowed: boolean;
  blocked: boolean;
  remaining_seconds?: number;
  attempts_left?: number;
}

const RATE_LIMITS = {
  login: {
    maxAttempts: 5,
    windowMinutes: 15,
    blockMinutes: 30,
  },
  signup: {
    maxAttempts: 3,
    windowMinutes: 60,
    blockMinutes: 60,
  },
  post: {
    maxAttempts: 10,
    windowMinutes: 60,
    blockMinutes: 30,
  },
  passwordReset: {
    maxAttempts: 3,
    windowMinutes: 60,
    blockMinutes: 120,
  },
};

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Server-side rate limiter using Supabase database
 * Prevents client-side bypass attacks
 */
export class ServerRateLimiter {
  /**
   * Check and record rate limit attempt
   * @returns Promise with rate limit status
   */
  async check(type: RateLimitType, identifier: string): Promise<RateLimitResult> {
    const config = RATE_LIMITS[type];

    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_action: type,
        p_max_attempts: config.maxAttempts,
        p_window_minutes: config.windowMinutes,
        p_block_minutes: config.blockMinutes,
      });

      if (error) {
        console.error('Rate limit check error:', error);
        // Fail open to prevent blocking legitimate users on errors
        return { allowed: true, blocked: false };
      }

      return {
        allowed: (data as any).allowed,
        blocked: (data as any).blocked,
        remaining_seconds: (data as any).remaining_seconds,
        attempts_left: (data as any).attempts_left,
      };
    } catch (error) {
      console.error('Rate limit check exception:', error);
      return { allowed: true, blocked: false };
    }
  }

  /**
   * Reset rate limit after successful action (e.g., successful login)
   */
  async reset(type: RateLimitType, identifier: string): Promise<void> {
    try {
      await supabase.rpc('reset_rate_limit', {
        p_identifier: identifier,
        p_action: type,
      });
    } catch (error) {
      console.error('Rate limit reset error:', error);
    }
  }

  /**
   * Format remaining time in user-friendly message
   */
  formatRemainingTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} segundos`;
    }

    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    }

    const hours = Math.ceil(minutes / 60);
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  }
}

export const serverRateLimiter = new ServerRateLimiter();
