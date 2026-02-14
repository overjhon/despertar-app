import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface XPBarProps {
  currentXP: number;
  currentLevel: number;
}

export const XPBar = ({ currentXP, currentLevel }: XPBarProps) => {
  const [levelName, setLevelName] = useState('');
  const [xpForCurrentLevel, setXpForCurrentLevel] = useState(0);
  const [xpForNextLevel, setXpForNextLevel] = useState(500);

  useEffect(() => {
    const fetchLevelData = async () => {
      const { data: name } = await supabase.rpc('get_level_name', { level: currentLevel });
      const { data: currentLevelXP } = await supabase.rpc('get_xp_for_level', { level: currentLevel - 1 });
      const { data: nextLevelXP } = await supabase.rpc('get_xp_for_level', { level: currentLevel });

      setLevelName(name || '');
      setXpForCurrentLevel(currentLevelXP || 0);
      setXpForNextLevel(nextLevelXP || 500);
    };

    fetchLevelData();
  }, [currentLevel]);

  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-primary to-primary/60 text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg">
            {currentLevel}
          </div>
          <div>
            <p className="font-semibold text-foreground">{levelName}</p>
            <p className="text-xs text-muted-foreground">
              {xpInCurrentLevel} / {xpNeededForNextLevel} XP
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-primary">{currentXP} XP Total</p>
        </div>
      </div>
      <Progress value={progressPercentage} className="h-3" />
    </div>
  );
};
