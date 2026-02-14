import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ErrorLog {
  error_type: string;
  error_message: string;
  stack_trace?: string;
  user_id?: string;
  route?: string;
  user_agent?: string;
  timestamp: string;
}

export const useErrorMonitoring = () => {
  const { user } = useAuth();

  useEffect(() => {
    const shouldIgnore = (msg?: string) => {
      const message = (msg || '').toString();
      return (
        message.includes('ERR_ABORTED') ||
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('ChunkLoadError')
      );
    };

    const handleError = (event: ErrorEvent) => {
      if (shouldIgnore(event.message)) {
        if (import.meta.env.DEV) console.warn('🔕 Ignorando runtime error benigno:', event.message);
        return;
      }
      logError({
        error_type: 'runtime_error',
        error_message: event.message,
        stack_trace: event.error?.stack,
        route: window.location.pathname,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonMsg = event.reason?.message || String(event.reason);
      if (shouldIgnore(reasonMsg)) {
        if (import.meta.env.DEV) console.warn('🔕 Ignorando promise rejection benigno:', reasonMsg);
        return;
      }
      logError({
        error_type: 'promise_rejection',
        error_message: reasonMsg,
        stack_trace: event.reason?.stack,
        route: window.location.pathname,
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [user]);

  const logError = async (error: Omit<ErrorLog, 'user_id' | 'user_agent' | 'timestamp'>) => {
    try {
      const errorLog = {
        ...error,
        user_id: user?.id,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };

      // Log para console em desenvolvimento
      if (import.meta.env.DEV) {
        console.error('Error logged:', errorLog);
      }

      // Enviar para Sentry em produção (se configurado)
      if (import.meta.env.PROD && (window as Window).Sentry) {
        (window as Window).Sentry!.captureException(new Error(error.error_message), {
          extra: errorLog,
          tags: {
            error_type: error.error_type,
            route: error.route,
          },
          user: user ? { id: user.id } : undefined,
        });
      }

      // Salvar em analytics_events apenas em produção para evitar ruído no dev
      if (import.meta.env.PROD) {
        await supabase.from('analytics_events').insert({
          event_name: 'error_logged',
          user_id: user?.id,
          metadata: errorLog,
        });
      }
    } catch (err) {
      console.error('Failed to log error:', err);
    }
  };

  return { logError };
};
