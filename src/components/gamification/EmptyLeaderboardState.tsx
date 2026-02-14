import { Trophy, BookOpen, Flame, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface EmptyLeaderboardStateProps {
  type: 'general' | 'daily' | 'weekly' | 'monthly' | 'pages' | 'books' | 'streaks' | 'time';
}

export const EmptyLeaderboardState = ({ type }: EmptyLeaderboardStateProps) => {
  const navigate = useNavigate();

  const configs = {
    general: {
      icon: Trophy,
      title: 'Continue Lendo!',
      message: 'Leia mais páginas para aparecer no ranking',
      tip: 'Ganhe XP lendo ebooks e interagindo na comunidade',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    daily: {
      icon: TrendingUp,
      title: 'Nenhuma Atividade Hoje',
      message: 'Ainda não há leituras registradas hoje',
      tip: 'Comece a ler agora e apareça no ranking diário!',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    weekly: {
      icon: Flame,
      title: 'Ranking Semanal Vazio',
      message: 'Ninguém apareceu no ranking desta semana ainda',
      tip: 'Leia consistentemente para dominar a semana',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    monthly: {
      icon: Trophy,
      title: 'Ranking Mensal Aguardando',
      message: 'Seja o primeiro do mês!',
      tip: 'Mantenha uma rotina de leitura para liderar',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    pages: {
      icon: BookOpen,
      title: 'Nenhuma Página Lida',
      message: 'Ainda não há registro de páginas lidas',
      tip: 'Cada página conta! Comece sua jornada agora',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    books: {
      icon: BookOpen,
      title: 'Nenhum Livro Completado',
      message: 'Seja o primeiro a completar um livro!',
      tip: 'Termine sua primeira leitura para aparecer aqui',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    streaks: {
      icon: Flame,
      title: 'Sem Sequências Ativas',
      message: 'Ainda não há sequências de leitura registradas',
      tip: 'Leia todos os dias para construir sua sequência',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    time: {
      icon: TrendingUp,
      title: 'Tempo de Leitura Zerado',
      message: 'Nenhum tempo de leitura registrado ainda',
      tip: 'Quanto mais você lê, mais você aprende!',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className={`${config.bgColor} rounded-full p-6 mb-6 animate-pulse`}>
        <Icon className={`w-12 h-12 ${config.color}`} />
      </div>
      
      <h3 className="text-xl font-semibold mb-3">{config.title}</h3>
      <p className="text-muted-foreground mb-2 max-w-sm">{config.message}</p>
      <p className="text-sm text-muted-foreground/80 mb-6 max-w-md">
        💡 {config.tip}
      </p>
      
      <Button onClick={() => navigate('/library')} className="gap-2">
        <BookOpen className="w-4 h-4" />
        Ir para Biblioteca
      </Button>
    </div>
  );
};
