import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const MaterialsCard = () => {
  const { user } = useAuth();
  const collshopUrl = 'https://collshp.com/ichisaa/category/2850597?share_channel_code=1&view=storefront';

  const handleClick = async () => {
    if (user) {
      try {
        await supabase.from('analytics_events').insert({
          event_name: 'collshop_link_clicked',
          user_id: user.id,
          metadata: { source: 'sidebar' }
        });
      } catch (error) {
        console.error('Error tracking analytics:', error);
      }
    }
    
    window.open(collshopUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 shadow-elegant">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Materiais</h3>
            <p className="text-xs text-muted-foreground">
              Fornecedores confiáveis
            </p>
          </div>
        </div>

        <Button 
          onClick={handleClick}
          size="sm"
          className="w-full gap-2 text-xs"
          variant="default"
        >
          <ShoppingBag className="w-4 h-4" />
          Ver Loja
          <ExternalLink className="w-3 h-3" />
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          🛍️ Produtos selecionados pela comunidade
        </p>
      </div>
    </Card>
  );
};
