import { NavLink } from 'react-router-dom';
import { Home, Users, Target, Trophy, User, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/library', icon: Home, label: 'Biblioteca', ariaLabel: 'Ir para biblioteca' },
  { path: '/community', icon: Users, label: 'Comunidade', ariaLabel: 'Ir para comunidade' },
  { path: '/challenges', icon: Target, label: 'Desafios', ariaLabel: 'Ir para desafios' },
  { path: '/leaderboard', icon: Trophy, label: 'Ranking', ariaLabel: 'Ir para ranking' },
  { path: '/profile', icon: User, label: 'Perfil', ariaLabel: 'Ir para perfil' },
];

export function BottomNav() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.rpc('has_role', { 
          _user_id: user.id, 
          _role: 'admin' 
        });
        
        if (mounted && !error) {
          setIsAdmin(!!data);
        } else if (mounted) {
          setIsAdmin(false);
        }
      } catch {
        if (mounted) setIsAdmin(false);
      }
    };
    
    checkAdmin();
    
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const itemsToShow = isAdmin
    ? [
        ...navItems,
        { path: '/admin/manage', icon: Shield, label: 'Admin', ariaLabel: 'Ir para administração' },
      ]
    : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t-2 border-primary/20 shadow-elegant">
      <div className="flex items-center justify-around h-20 px-2">
        {itemsToShow.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            aria-label={item.ariaLabel}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl transition-all duration-300 min-w-[68px] min-h-[44px]",
                isActive
                  ? "text-primary scale-110 bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5 hover:scale-105"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(
                  "w-7 h-7 transition-all duration-300", 
                  isActive && "drop-shadow-[0_0_12px_hsl(var(--primary)/0.8)]"
                )} />
                <span className={cn(
                  "text-xs font-medium transition-all", 
                  isActive && "font-bold"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 w-10 h-1 bg-gradient-primary rounded-full shadow-glow" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
