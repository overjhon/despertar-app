import { LevelBadge } from '@/components/gamification/LevelBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserGamification } from '@/hooks/useUserGamification';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';

interface UserStatusPreviewProps {
  userId: string;
}

export const UserStatusPreview = ({ userId }: UserStatusPreviewProps) => {
  const { gamificationData, badges, loading } = useUserGamification(userId);
  const [levelName, setLevelName] = useState<string>('');

  useEffect(() => {
    const fetchLevelName = async () => {
      if (gamificationData) {
        const { data } = await supabase.rpc('get_level_name', { 
          level: gamificationData.current_level 
        });
        if (data) setLevelName(data);
      }
    };
    fetchLevelName();
  }, [gamificationData]);

  if (loading) {
    return <Skeleton className="h-6 w-24" />;
  }

  if (!gamificationData) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <LevelBadge 
        level={gamificationData.current_level} 
        levelName={levelName}
      />
      
      {badges.length > 0 && (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            {badges.map((badge) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <div className="text-lg hover:scale-110 transition-transform cursor-help">
                    {badge.badges.icon}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{badge.badges.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Conquistado em {new Date(badge.earned_at).toLocaleDateString('pt-BR')}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};
