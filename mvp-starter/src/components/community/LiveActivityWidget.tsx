import { Card } from '@/components/ui/card';
import { Eye, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { useLiveActivity } from '@/hooks/useLiveActivity';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LiveActivityWidgetProps {
  ebookId: string;
}

export const LiveActivityWidget = ({ ebookId }: LiveActivityWidgetProps) => {
  const { stats } = useLiveActivity(ebookId);

  return (
    <div className="space-y-4">
      <Card className="p-4 border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Visualizando agora</p>
            <p className="text-2xl font-bold">{stats.viewingCount} pessoas</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-green-500/20 bg-green-500/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Leituras este mês</p>
            <p className="text-2xl font-bold text-green-500">{stats.purchasedThisMonth}</p>
          </div>
        </div>
      </Card>

      {stats.readingCount > 0 && (
        <Card className="p-4 border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Lendo agora</p>
              <p className="text-2xl font-bold text-blue-500">{stats.readingCount} pessoas</p>
            </div>
          </div>
        </Card>
      )}

      {stats.recentPurchases.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm">Atividade Recente</p>
          </div>
          <div className="space-y-2">
            {stats.recentPurchases.map((purchase, i) => (
              <p key={i} className="text-sm text-muted-foreground">
                🎉 Alguém de <span className="font-medium">{purchase.location}</span> acabou de adquirir{' '}
                <span className="text-xs">
                  ({formatDistanceToNow(new Date(purchase.created_at), { 
                    addSuffix: true,
                    locale: ptBR 
                  })})
                </span>
              </p>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
