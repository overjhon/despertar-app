import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { InstallInstructions } from './InstallInstructions';
import { useAuth } from '@/contexts/AuthContext';
import { useXP } from '@/hooks/useXP';
import { useBadges } from '@/hooks/useBadges';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface InstallAppButtonProps {
  variant?: 'default' | 'premium' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  hideText?: boolean;
}

export const InstallAppButton = ({ 
  variant = 'premium', 
  size = 'default',
  className = '',
  showIcon = true,
  hideText = false
}: InstallAppButtonProps) => {
  const { user } = useAuth();
  const { addXP } = useXP();
  const { awardBadge, hasBadge, allBadges } = useBadges();
  const { 
    isInstallable, 
    isInstalled, 
    isIOS,
    canInstallPWA,
    promptInstall 
  } = useInstallPrompt();
  
  const [showInstructions, setShowInstructions] = useState(false);
  const [rewardProcessed, setRewardProcessed] = useState(false);
  const [waitingForPrompt, setWaitingForPrompt] = useState(false);

  // Check if user already received installation reward
  useEffect(() => {
    const installBadge = allBadges.find(b => b.icon === 'smartphone');
    if (installBadge && user) {
      setRewardProcessed(hasBadge(installBadge.id));
    }
  }, [allBadges, hasBadge, user]);

  // Listen for app installation and give reward
  useEffect(() => {
    const handleAppInstalled = async () => {
      if (!user || rewardProcessed) return;

      try {
        // Find installation badge
        const installBadge = allBadges.find(b => b.icon === 'smartphone');
        if (!installBadge) return;

        // Award badge
        await awardBadge(installBadge.id);

        // Award XP
        await addXP({
          amount: installBadge.xp_reward,
          reason: 'app_install',
          metadata: { badge_id: installBadge.id }
        });

        // Show celebration toast
        toast({
          title: "🎉 App Instalado!",
          description: `Você ganhou +${installBadge.xp_reward} XP e desbloqueou o badge "${installBadge.name}"!`,
          duration: 5000,
        });

        setRewardProcessed(true);
      } catch (error) {
        console.error('Error processing installation reward:', error);
      }
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, [user, addXP, awardBadge, allBadges, rewardProcessed]);

  // Listen for prompt becoming available while waiting
  useEffect(() => {
    if (waitingForPrompt && isInstallable) {
      promptInstall();
      setWaitingForPrompt(false);
    }
  }, [isInstallable, waitingForPrompt, promptInstall]);

  // Hide button if app is already installed
  if (isInstalled) return null;

  const handleInstall = async () => {
    // iOS sempre precisa de instruções manuais
    if (isIOS) {
      setShowInstructions(true);
      return;
    }

    // Se já temos o prompt disponível, usar imediatamente
    if (isInstallable) {
      await promptInstall();
      return;
    }

    // Para navegadores que PODEM suportar PWA (Chrome/Edge), aguardar o evento
    if (canInstallPWA) {
      toast({
        title: "Preparando instalação...",
        description: "Aguarde alguns instantes",
        duration: 3000,
      });
      
      setWaitingForPrompt(true);
      
      // Timeout de segurança: se após 5s não recebeu o evento, mostrar instruções
      setTimeout(() => {
        if (!isInstallable) {
          setWaitingForPrompt(false);
          setShowInstructions(true);
        }
      }, 5000);
      
      return;
    }

    // Fallback apenas para navegadores que NÃO suportam PWA (Firefox, Safari desktop, etc)
    setShowInstructions(true);
  };

  return (
    <>
      <Button
        onClick={handleInstall}
        variant={variant}
        size={size}
        className={className}
      >
        {showIcon && <Smartphone className="w-4 h-4" />}
        {!hideText && "Instalar App"}
      </Button>

      <InstallInstructions 
        open={showInstructions} 
        onOpenChange={setShowInstructions} 
      />
    </>
  );
};
