import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Hook para logout automático após inatividade
 * @param timeoutMinutes - Minutos de inatividade antes do logout (padrão: 30)
 */
export const useSessionTimeout = (timeoutMinutes: number = 30) => {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const TIMEOUT_MS = timeoutMinutes * 60 * 1000;
  const WARNING_MS = TIMEOUT_MS - (5 * 60 * 1000); // Aviso 5 minutos antes

  const resetTimer = () => {
    // Limpar timers anteriores
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Só ativar se usuário estiver logado
    if (!user) return;

    // Timer de aviso (5 minutos antes)
    warningRef.current = setTimeout(() => {
      toast.warning('Sessão expirando', {
        description: 'Você será desconectado em 5 minutos por inatividade.',
        duration: 10000,
      });
    }, WARNING_MS);

    // Timer de logout
    timeoutRef.current = setTimeout(async () => {
      toast.info('Sessão expirada', {
        description: 'Você foi desconectado por inatividade.',
      });
      await signOut();
    }, TIMEOUT_MS);
  };

  useEffect(() => {
    if (!user) return;

    // Eventos que resetam o timer
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Iniciar timer
    resetTimer();

    // Adicionar listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user]);

  return { resetTimer };
};
